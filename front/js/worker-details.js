document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const workerName = urlParams.get('worker');

    async function fetchWorkLogs() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs');
            const logs = response.data;
            return logs.filter(log => log.task_man.includes(workerName));
        } catch (error) {
            console.error('Error fetching work logs:', error);
        }
    }

    async function initCalendar() {
        const logs = await fetchWorkLogs();

        const events = logs.reduce((acc, log) => {
            const date = log.task_date;
            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);

            if (!acc[date]) {
                acc[date] = {
                    start: date,
                    taskCount: 1,
                    totalMinutes: hours * 60 + minutes,
                    descriptions: [`${log.task_name}`]  // 작업 내용에서 시간 부분 제거
                };
            } else {
                acc[date].taskCount += 1;
                acc[date].totalMinutes += hours * 60 + minutes;
                acc[date].descriptions.push(`${log.task_name}`);  // 작업 내용에서 시간 부분 제거
            }

            return acc;
        }, {});

        const eventArray = Object.values(events).map(event => {
            const hours = Math.floor(event.totalMinutes / 60);
            const minutes = event.totalMinutes % 60;
            return {
                title: `작업수: ${event.taskCount}, 시간: ${hours}시간 ${minutes}분`,
                start: event.start,
                description: event.descriptions.join('\n'),
                taskCount: event.taskCount,
                totalMinutes: event.totalMinutes
            };
        });

        $('#calendar').fullCalendar({
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month'  // 월(Month) 보기만 사용
            },
            defaultView: 'month',  // 월(Month) 보기가 기본값
            editable: false,
            events: eventArray,
            eventRender: function(event, element) {
                element.find('.fc-time').remove();  // 12a 제거
                element.find('.fc-title').html(`
                    <b>작업수:</b> ${event.taskCount}<br>
                    <b>시간:</b> ${Math.floor(event.totalMinutes / 60)}시간 ${event.totalMinutes % 60}분<br>
                    <b>작업 내용:</b><br>${event.description.replace(/\n/g, '<br>')}
                `);
            },
            eventClick: function(event) {
                alert(`작업수: ${event.taskCount}\n시간: ${Math.floor(event.totalMinutes / 60)}시간 ${event.totalMinutes % 60}분\n작업 내용: \n${event.description}`);
            }
        });
    }

    initCalendar();
});
