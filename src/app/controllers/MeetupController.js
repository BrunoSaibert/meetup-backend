import * as Yup from 'yup';

import { parseISO, isBefore } from 'date-fns';

import Meetup from '../models/Meetup';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      date: Yup.date().required(),
      location: Yup.string().required(),
      file_id: Yup.number().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    /* check for past dates */
    if (isBefore(parseISO(req.body.date), new Date())) {
      return res
        .status(400)
        .json({ error: 'Can not Create a past date meetup.' });
    }

    const user_id = req.userId;

    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json({ meetup });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      date: Yup.date(),
      location: Yup.string(),
      file_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    /* check meetup creator */
    if (req.userId !== meetup.user_id) {
      return res.status(400).json({ error: 'Not authorized.' });
    }

    /* check for past dates */
    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'Can not Update a past date meetup.' });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'Can not delete a past date meetup.' });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
