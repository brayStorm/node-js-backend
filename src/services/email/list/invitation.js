const { getNotification } = require('../../notifications/helpers');

module.exports = class PasswordResetEmail {
  constructor(to, link) {
    this.to = to;
    this.link = link;
  }

  get subject() {
    return getNotification(
      'emails.invitation.subject',
      getNotification('app.title'),
    );
  }

  get html() {
    return getNotification(
      'emails.invitation.body',
      getNotification('app.title'),
      this.to,
      this.link,
    );
  }
};
