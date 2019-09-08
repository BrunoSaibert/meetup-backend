import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;

    await Mail.sendMail({
      to: `${meetup.User.name} <${meetup.User.email}>`,
      subject: 'Nova inscrição',
      template: 'subscription',
      context: {
        organizer: meetup.User.name,
        meetup: meetup.title,
        name: user.name,
        email: user.email,
      },
    });
  }
}

export default new SubscriptionMail();
