const { pool } = require('../../config/database');
const XLSX = require('xlsx');

exports.getData = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM userDB');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error retrieving data:', err);
    res.status(500).json({ error: 'Error retrieving data' });
  }
};

exports.exportToExcel = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM userDB');
    
    // 데이터를 워크북으로 변환
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SECM Data');
    
    // 엑셀 파일로 변환
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // 엑셀 파일 다운로드
    res.setHeader('Content-Disposition', 'attachment; filename=secm_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ error: 'Error exporting data' });
  }
};
