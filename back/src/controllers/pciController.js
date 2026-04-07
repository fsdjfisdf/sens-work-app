'use strict';

const pciService = require('../services/pciService');
const { resolveUserIdx } = require('../dao/pciDao');

function extractUserIdx(req) {
  return (
    req.user?.userIdx ||
    req.user?.user_idx ||
    req.auth?.userIdx ||
    req.userIdx ||
    null
  );
}

exports.getFilterOptions = async (req, res, next) => {
  try {
    const data = await pciService.getFilterOptions();
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getMatrix = async (req, res, next) => {
  try {
    const data = await pciService.getMatrix(req.query);
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getCellDetail = async (req, res, next) => {
  try {
    const data = await pciService.getCellDetail(req.query);
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getEngineerDetail = async (req, res, next) => {
  try {
    const data = await pciService.getEngineerDetail({
      ...req.query,
      engineer_id: req.params.engineerId,
    });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getAdminItems = async (req, res, next) => {
  try {
    const data = await pciService.getAdminItems(req.query);
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updatePciItem = async (req, res, next) => {
  try {
    const data = await pciService.updatePciItem({
      userIdx: extractUserIdx(req),
      pciItemId: req.params.pciItemId,
      body: req.body || {},
    });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};

exports.rebuildRange = async (req, res, next) => {
  try {
    const data = await pciService.rebuildRange({
      userIdx: extractUserIdx(req),
      body: req.body || {},
    });
    res.json({ isSuccess: true, data });
  } catch (err) {
    next(err);
  }
};
