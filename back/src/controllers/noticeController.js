const noticeService = require("../service/noticeService");
const { logger } = require("../config/winston");

exports.getAllNotices = async (req, res) => {
  try {
    const result = await noticeService.getAllNotices();
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Failed to get notices: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getNoticeById = async (req, res) => {
  try {
    const result = await noticeService.getNoticeById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Failed to get notice: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.createNotice = async (req, res) => {
  const { notice_date, title, content } = req.body;
  try {
    const result = await noticeService.createNotice(notice_date, title, content);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Failed to create notice: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.updateNotice = async (req, res) => {
  const { notice_date, title, content } = req.body;
  try {
    await noticeService.updateNotice(req.params.id, notice_date, title, content);
    res.status(200).send("Notice updated successfully");
  } catch (error) {
    logger.error(`Failed to update notice: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    await noticeService.deleteNotice(req.params.id);
    res.status(200).send("Notice deleted successfully");
  } catch (error) {
    logger.error(`Failed to delete notice: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
