document.addEventListener('DOMContentLoaded', () => {
    const calendarContainer = document.getElementById('calendarContainer');
    const noticeForm = document.getElementById('noticeForm');
    const noticeDetail = document.getElementById('noticeDetail');
    const noticeId = document.getElementById('noticeId');
    const noticeDate = document.getElementById('noticeDate');
    const noticeTitle = document.getElementById('noticeTitle');
    const noticeContent = document.getElementById('noticeContent');
    const saveNotice = document.getElementById('saveNotice');
    const deleteNotice = document.getElementById('deleteNotice');
    const cancelNotice = document.getElementById('cancelNotice');
    const detailTitle = document.getElementById('detailTitle');
    const detailDate = document.getElementById('detailDate');
    const detailContent = document.getElementById('detailContent');
    const closeDetail = document.getElementById('closeDetail');
    const createNoticeButton = document.getElementById('createNotice');

    let notices = [];

    // 공지사항 데이터 불러오기
    const fetchNotices = async () => {
        const response = await fetch('http://3.37.165.84:3001/notices', {
            headers: {
                'x-access-token': localStorage.getItem('x-access-token')
            }
        });
        notices = await response.json();
        renderCalendar();
    };

    // 달력 렌더링
    const renderCalendar = () => {
        const calendar = document.createElement('div');
        calendar.className = 'calendar';

        const dates = new Set(notices.map(notice => notice.notice_date));

        dates.forEach(date => {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            day.textContent = date;

            const notice = notices.find(notice => notice.notice_date === date);
            if (notice) {
                day.addEventListener('click', () => showNoticeDetail(notice.id));
            }

            calendar.appendChild(day);
        });

        calendarContainer.innerHTML = '';
        calendarContainer.appendChild(calendar);
    };

    // 공지사항 상세 보기
    const showNoticeDetail = (id) => {
        const notice = notices.find(notice => notice.id === id);

        detailTitle.textContent = notice.title;
        detailDate.textContent = notice.notice_date;
        detailContent.textContent = notice.content;

        noticeDetail.classList.remove('hidden');
    };

    // 공지사항 저장
    saveNotice.addEventListener('click', async () => {
        const id = noticeId.value;
        const notice_date = noticeDate.value;
        const title = noticeTitle.value;
        const content = noticeContent.value;

        if (!notice_date || !title || !content) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        const noticeData = { notice_date, title, content };

        let method = 'POST';
        let url = 'http://3.37.165.84:3001/notices';

        if (id) {
            method = 'PUT';
            url += `/${id}`;
        }

        await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('x-access-token')
            },
            body: JSON.stringify(noticeData)
        });

        fetchNotices();
        clearForm();
        noticeForm.classList.add('hidden');
    });

    // 공지사항 삭제
    deleteNotice.addEventListener('click', async () => {
        const id = noticeId.value;

        if (!id) return;

        await fetch(`http://3.37.165.84:3001/notices/${id}`, {
            method: 'DELETE',
            headers: {
                'x-access-token': localStorage.getItem('x-access-token')
            }
        });

        fetchNotices();
        clearForm();
        noticeForm.classList.add('hidden');
    });

    // 공지사항 작성 폼 초기화
    const clearForm = () => {
        noticeId.value = '';
        noticeDate.value = '';
        noticeTitle.value = '';
        noticeContent.value = '';
        deleteNotice.classList.add('hidden');
    };

    // 공지사항 작성 폼 열기
    createNoticeButton.addEventListener('click', () => {
        clearForm();
        noticeForm.classList.remove('hidden');
        deleteNotice.classList.add('hidden');
    });

    // 공지사항 작성 폼 닫기
    cancelNotice.addEventListener('click', () => {
        clearForm();
        noticeForm.classList.add('hidden');
    });

    // 공지사항 상세 보기 닫기
    closeDetail.addEventListener('click', () => {
        noticeDetail.classList.add('hidden');
    });

    fetchNotices();
});
