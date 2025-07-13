import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const formatDate = {
    toLocalDate: (date: string, format: string = 'YYYY-MM-DD') => dayjs(date).format(format),
    toLocalDateTime: (date: string) => dayjs(date).toDate(),
    toUTCDate: (date: string, format: string = 'YYYY-MM-DD') => dayjs(date).utc().format(format),
    toUTCDateTime: (date: string) => dayjs(date).utc().toDate(),
};
