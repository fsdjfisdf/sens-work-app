const noticeDao = require("../dao/noticeDao");

exports.getAllNotices = async () => {
  return await noticeDao.getAllNotices();
};

exports.getNoticeById = async (id) => {
  return await noticeDao.getNoticeById(id);
};

exports.createNotice = async (notice_date, title, content) => {
  return await noticeDao.createNotice(notice_date, title, content);
};

exports.updateNotice = async (id, notice_date, title, content) => {
  await noticeDao.updateNotice(id, notice_date, title, content);
};

exports.deleteNotice = async (id) => {
  await noticeDao.deleteNotice(id);
};
