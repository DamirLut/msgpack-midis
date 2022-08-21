import { DataDay, DataGroup, DataPar, DataType, TimeTableType } from './data';
import { getBytesFromString } from './utils';

enum Days {
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
}

export class MsgPackMidis {
  private buffer: number[] = [];
  private offset = 0;
  private metaData: Record<string, number> = {};

  encode(data: DataType) {
    const group = data['Группа П-28'];
    this.encodeMetadata(group);
    const days = [...group.weeks.firstWeek, ...group.weeks.secondWeek];

    this.buffer.push(days.length);

    days.forEach((day) => {
      this.encodeDay(day);
    });

    return new Uint16Array(this.buffer);
  }

  decode(data: number[]) {
    this.buffer = data;
    this.offset = this.decodeMetaData(this.buffer);
    console.log(data.length - this.offset);
    const days = this.buffer[this.offset++];

    const result = [];

    for (let i = 0; i < days; i++) {
      const day = this.decodeDay();
      result.push(day);
    }

    return result;
  }

  private encodeMetadata(data: DataGroup) {
    const metadata = new Set<string>();

    [...data.weeks.firstWeek, ...data.weeks.secondWeek].forEach((day) => {
      day.dayPars.forEach((par) => {
        metadata.add(par.teacher);
        metadata.add(par.object);
      });
    });
    this.buffer.push(metadata.size);
    metadata.forEach((value) => {
      this.metaData[value] = this.buffer.length;
      const bytes = getBytesFromString(value);
      this.buffer.push(bytes.length, ...bytes);
    });
  }

  private decodeMetaData(buff: number[]) {
    let count = buff[0];
    let offset = 1;
    const decoder = new TextDecoder('utf-8');
    for (let i = 0; i < count; i++) {
      const size = buff[offset];
      const result = decoder.decode(new Uint8Array(buff.slice(offset + 1, offset + 1 + size)));
      this.metaData[result] = offset;
      offset += size + 1;
    }
    return offset;
  }

  private encodeDay(day: DataDay) {
    let [date] = day.dayName.split(' ');
    const dateInfo = date.split('.').map((value) => parseInt(value));
    const value = (((day.dayPars.length << 4) | dateInfo[1]) << 5) | dateInfo[0];
    this.buffer.push(value);

    day.dayPars.forEach((par) => this.encodePar(par));
  }

  private decodeDay(): DataDay {
    const value = this.buffer[this.offset];

    const pars = value >> 9;
    const month = (value >> 5) & 0xf;
    const day = value & 31;

    const dayPars: DataPar[] = [];

    for (let i = 0; i < pars; i++) {
      const teacherOffset = this.buffer[++this.offset];
      const objectOffset = this.buffer[++this.offset];
      const _class = this.buffer[++this.offset];
      const parValue = this.buffer[++this.offset];

      const id = parValue >> 4;
      const danger = (parValue & 1) == 1;

      dayPars.push({
        class: _class.toString(),
        id,
        danger,
        teacher: this.getMetadata(teacherOffset),
        object: this.getMetadata(objectOffset),
        flow: 'Все',
      });
    }

    this.offset++;

    return {
      dayPars,
      dayName: `${day}.${month}`,
      dayTimetable: 'normal',
    };
  }

  private getMetadata(offset: number) {
    for (let [key, value] of Object.entries(this.metaData)) {
      if (value === offset) {
        return key;
      }
    }
    return '';
  }

  private encodePar(par: DataPar) {
    const teacherOffset = this.metaData[par.teacher];
    const objectOffset = this.metaData[par.object];
    const _class = Number(par.class);
    const id = par.id;

    const value = (id << 4) | Number(par.danger);

    this.buffer.push(teacherOffset, objectOffset, _class, value);
  }
}
