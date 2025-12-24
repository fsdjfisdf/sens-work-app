// back/src/controllers/signalController.js
const signalDao = require('../dao/signalDao');

exports.getSignalData = async (req, res) => {
  // 쿼리 파라미터 로그 찍어서 실제로 뭐가 오는지 확인
  console.log('==== [getSignalData] req.query ====');
  console.log(req.query); // { eqname: 'EPAP301', site: 'PT', ... }

  const { eqname, group, site, line, type, warranty_status } = req.query;

  try {
    const data = await signalDao.getSignalData({
      eqname,
      group,
      site,
      line,
      type,
      warranty_status,
    });

    // EQNAME은 굳이 소문자로 만들지 말고, 원본 보존하는 게 보기도 좋음
    const normalizedData = data.map((item) => ({
      ...item,
      // 필요하면 키로 쓰는 용도로만 별도 필드 만들기
      EQNAME_NORMALIZED: item.EQNAME ? item.EQNAME.trim().toLowerCase() : '',
    }));

    res.status(200).json(normalizedData);
  } catch (err) {
    console.error('Error retrieving equipment data:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSignalData = async (req, res) => {
  const eqName = req.params.eqName.trim().toLowerCase();
  const { info } = req.body;

  console.log('Received eqName:', eqName);
  console.log('Payload info:', info);

  try {
    const result = await signalDao.updateSignalData(eqName, info);
    console.log('Update successful:', result);
    res.status(200).send('Signal data updated');
  } catch (err) {
    if (err.message.includes('No matching EQNAME')) {
      console.error(`404 Not Found for eqName: ${eqName}`);
      res
        .status(404)
        .json({ error: `Equipment with EQNAME '${eqName}' not found.` });
    } else {
      console.error('Error updating signal data:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
};
