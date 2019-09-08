// import * as Yup from 'yup';

// import { parseISO, isBefore } from 'date-fns';

// import { where } from 'sequelize/types';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';

import Mail from '../../lib/Mail';
import User from '../models/User';

class SubscriptionController {
  async store(req, res) {
    const user_id = req.userId;
    const user = await User.findByPk(user_id);
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: [User],
    });

    if (meetup.user_id === user_id) {
      return res
        .status(400)
        .json({ error: 'Can not subscript for your own meetup.' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'Can not subscript to past meetup.' });
    }

    const checkAlreadSubscribe = await Subscription.findOne({
      where: {
        user_id,
        meetup_id: req.params.meetupId,
      },
    });

    if (checkAlreadSubscribe) {
      return res
        .status(400)
        .json({ error: 'You alread subscribe on this meetup.' });
    }

    const checkDate = await Subscription.findOne({
      where: {
        user_id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res.status(400).json({
        error: 'You have alread subscribe for another meetup at the same time.',
      });
    }

    const subscription = await Subscription.create({
      user_id,
      meetup_id: meetup.id,
    });

    // console.log(`${meetup.User.name} <${meetup.User.email}>`);
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

    return res.json(subscription);
  }
}

export default new SubscriptionController();
