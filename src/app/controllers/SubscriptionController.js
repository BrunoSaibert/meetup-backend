import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import User from '../models/User';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subscriptions);
  }

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

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
