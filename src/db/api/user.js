const db = require('../models');
const FileDBApi = require('./file');
const crypto = require('crypto');
const Utils = require('../utils');

const Sequelize = db.Sequelize;
const Op = Sequelize.Op;

module.exports = class UserDBApi {
  static async create(data, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;
    
    const user = await db.user.create(
      {
        id: data.data.id || undefined,
        email: data.data.email,
        emailVerified: true,
        role: data.data.role || 'user',
        firstName: data.data.firstName || null,
        lastName: data.data.lastName || null,
        authenticationUid: data.data.authenticationUid || null,
        phoneNumber: data.data.phoneNumber || null,
        importHash: data.data.importHash || null,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    await FileDBApi.replaceRelationFiles(
      {
        belongsTo: db.user.getTableName(),
        belongsToColumn: 'avatars',
        belongsToId: user.id,
      },
      data.data.avatars,
      options,
    );

    return user;
  }

  static async update(id, data, options) {
    const currentUser = (options && options.currentUser) || {id: null};
    const transaction = (options && options.transaction) || undefined;

    const user = await db.user.findByPk(id, {
      transaction,
    });

    await user.update(
      {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phoneNumber: data.phoneNumber || null,
        updatedById: currentUser.id,
        role: data.role || 'user',
        disabled: data.disabled || false
      },
      {transaction},
    );

    await FileDBApi.replaceRelationFiles(
      {
        belongsTo: db.user.getTableName(),
        belongsToColumn: 'avatars',
        belongsToId: user.id,
      },
      data.avatar,
      options,
    );

    return user;
  }

  static async remove(id, options) {
    const currentUser = (options && options.currentUser) || {id: null};
    const transaction = (options && options.transaction) || undefined;

    const user = await db.user.findByPk(id, options);

    await user.update({
      deletedBy: currentUser.id
    }, {
      transaction,
    });

    await user.destroy({
      transaction,
    });

    return user;
  }

  static async createFromAuth(data, options) {
    const transaction = (options && options.transaction) || undefined;
    const user = await db.user.create(
      {
        email: data.email,
        firstName: data.firstName,
        authenticationUid: data.authenticationUid,
        password: data.password,
      },
      { transaction },
    );

    await user.update(
      {
        authenticationUid: user.id,
      },
      { transaction },
    );

    delete user.password;
    return user;
  }

  static async updatePassword(id, password, options) {
    const currentUser = (options && options.currentUser) || { id: null };

    const transaction = (options && options.transaction) || undefined;

    const user = await db.user.findByPk(id, {
      transaction,
    });

    await user.update(
      {
        password,
        authenticationUid: id,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    return user;
  }

  static async generateEmailVerificationToken(email, options) {
    return this._generateToken(['emailVerificationToken', 'emailVerificationTokenExpiresAt'], email, options);
  }

  static async generatePasswordResetToken(email, options) {
    return this._generateToken(['passwordResetToken', 'passwordResetTokenExpiresAt'], email, options);
  }

  static async findBy(where, options) {
    const transaction = (options && options.transaction) || undefined;

    const user = await db.user.findOne(
      { where },
      { transaction },
    );

    if (!user) {
      return user;
    }

    const output = user.get({plain: true});
    output.avatar = await user.getAvatars({
      transaction
    });

    return output;
  }

  static async findAll(
    { filter, limit, offset, orderBy } = {
      filter: null,
      limit: 0,
      offset: 0,
      orderBy: null,
    },
    options,
  ) {
    const transaction = (options && options.transaction) || undefined;

    let where = {};
    let include = [{
      model: db.file,
      as: 'avatars'
    }];

    if (filter) {
      if (filter.id) {
        where = {
          ...where,
          ['id']: Utils.uuid(filter.id),
        };
      }

      if (filter.email) {
        where = {
          ...where,
          [Op.and]: Utils.ilike(
            'user',
            'email',
            filter.email,
          ),
        };
      }

      if (filter.createdAtRange) {
        const [start, end] = filter.createdAtRange;

        if (start !== undefined && start !== null && start !== '') {
          where = {
            ...where,
            ['createdAt']: {
              ...where.createdAt,
              [Op.gte]: start,
            },
          };
        }

        if (end !== undefined && end !== null && end !== '') {
          where = {
            ...where,
            ['createdAt']: {
              ...where.createdAt,
              [Op.lte]: end,
            },
          };
        }
      }
    }

    let { rows, count } = await db.user.findAndCountAll(
      {
        where,
        include,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        order: orderBy
          ? [orderBy.split('_')]
          : [['createdAt', 'DESC']],
        transaction,
      },
    );

    return { rows, count };
  }

  static async findAllAutocomplete(query, limit) {
    let where = {};

    if (query) {
      where = {
        [Op.or]: [
          { ['id']: Utils.uuid(query) },
          Utils.ilike(
            'user',
            'email',
            query,
          ),
        ],
      };
    }

    const users = await db.user.findAll({
      attributes: ['id', 'email'],
      where,
      limit: limit ? Number(limit) : undefined,
      orderBy: [['name', 'ASC']],
    });

    const buildText = (user) => {
      if (!user.name) {
        return user.email;
      }

      return `${user.name} <${user.email}>`;
    };

    return users.map((user) => ({
      id: user.id,
      label: buildText(user),
    }));
  }

  static async findByPasswordResetToken(token, options) {
    const transaction = (options && options.transaction) || undefined;

    return db.user.findOne(
      {
        where: {
          passwordResetToken: token,
          passwordResetTokenExpiresAt: {
            [db.Sequelize.Op.gt]: Date.now(),
          },
        },
      },
      { transaction },
    );
  }

  static async findByEmailVerificationToken(
    token,
    options,
  ) {
    const transaction = (options && options.transaction) || undefined;
    return db.user.findOne(
      {
        where: {
          emailVerificationToken: token,
          emailVerificationTokenExpiresAt: {
            [db.Sequelize.Op.gt]: Date.now(),
          },
        },
      },
      { transaction },
    );
  }

  static async markEmailVerified(id, options) {
    const currentUser = (options && options.currentUser) || { id: null };
    const transaction = (options && options.transaction) || undefined;

    const user = await db.user.findByPk(id, {
      transaction,
    });

    await user.update(
      {
        emailVerified: true,
        updatedById: currentUser.id,
      },
      { transaction },
    );

    return true;
  }

  static async _generateToken(keyNames, email, options) {
    const currentUser = (options && options.currentUser) || {id: null};
    const transaction = (options && options.transaction) || undefined;
    const user = await db.user.findOne(
      {
        where: {email},
      },
      {
        transaction,
      },
    );

    const token = crypto
      .randomBytes(20)
      .toString('hex');
    const tokenExpiresAt = Date.now() + 360000;

    await user.update(
      {
        [keyNames[0]]: token,
        [keyNames[1]]: tokenExpiresAt,
        updatedById: currentUser.id,
      },
      {transaction},
    );

    return token;
  }
};
