import { RegExp } from "../node_modules/assemblyscript-regex/assembly/index";

import { Duration, DurationLike } from "./duration";
import { Overflow, TimeComponent } from "./enums";
import {
  dayOfWeek,
  dayOfYear,
  leapYear,
  weekOfYear,
  daysInMonth,
  toPaddedString,
  coalesce,
  compareTemporalDateTime,
  addDateTime,
} from "./utils";

export class DateTimeLike {
  year: i32 = -1;
  month: i32 = -1;
  day: i32 = -1;
  hour: i32 = -1;
  minute: i32 = -1;
  second: i32 = -1;
  millisecond: i32 = -1;
  microsecond: i32 = -1;
  nanosecond: i32 = -1;
}

export class PlainDateTime {
  @inline
  static fromPlainDateTime(date: PlainDateTime): PlainDateTime {
    return new PlainDateTime(
      date.year,
      date.month,
      date.day,
      date.hour,
      date.minute,
      date.second,
      date.millisecond,
      date.microsecond,
      date.nanosecond
    );
  }

  @inline
  static fromDateTimeLike(date: DateTimeLike): PlainDateTime {
    if (date.year == -1 || date.month == -1 || date.day == -1) {
      throw new TypeError("missing required property");
    }
    return new PlainDateTime(
      date.year,
      date.month,
      date.day,
      date.hour,
      date.minute,
      date.second,
      date.millisecond,
      date.microsecond,
      date.nanosecond
    );
  }

  static fromString(date: string): PlainDateTime {
    const dateRegex = new RegExp(
      "^((?:[+-]\\d{6}|\\d{4}))(?:-(\\d{2})-(\\d{2})|(\\d{2})(\\d{2}))(?:(?:T|\\s+)(\\d{2})(?::(\\d{2})(?::(\\d{2})(?:[.,](\\d{1,9}))?)?|(\\d{2})(?:(\\d{2})(?:[.,](\\d{1,9}))?)?)?)?(?:([zZ])|(?:([+-])([01][0-9]|2[0-3])(?::?([0-5][0-9])(?::?([0-5][0-9])(?:[.,](\\d{1,9}))?)?)?)?)(?:\\[((?:(?:\\.\\.[-A-Za-z._]{1,12}|\\.[-A-Za-z_][-A-Za-z._]{0,12}|_[-A-Za-z._]{0,13}|[a-zA-Z](?:[A-Za-z._][-A-Za-z._]{0,12})?|[a-zA-Z]-(?:[-._][-A-Za-z._]{0,11})?|[a-zA-Z]-[a-zA-Z](?:[-._][-A-Za-z._]{0,10})?|[a-zA-Z]-[a-zA-Z][a-zA-Z](?:[A-Za-z._][-A-Za-z._]{0,9})?|[a-zA-Z]-[a-zA-Z][a-zA-Z]-(?:[-._][-A-Za-z._]{0,8})?|[a-zA-Z]-[a-zA-Z][a-zA-Z]-[a-zA-Z](?:[-._][-A-Za-z._]{0,7})?|[a-zA-Z]-[a-zA-Z][a-zA-Z]-[a-zA-Z][a-zA-Z](?:[-._][-A-Za-z._]{0,6})?)(?:\\/(?:\\.[-A-Za-z_]|\\.\\.[-A-Za-z._]{1,12}|\\.[-A-Za-z_][-A-Za-z._]{0,12}|[A-Za-z_][-A-Za-z._]{0,13}))*|Etc\\/GMT[-+]\\d{1,2}|(?:[+\\u2212-][0-2][0-9](?::?[0-5][0-9](?::?[0-5][0-9](?:[.,]\\d{1,9})?)?)?)))\\])?(?:\\[u-ca-((?:[A-Za-z0-9]{3,8}(?:-[A-Za-z0-9]{3,8})*))\\])?$",
      "i"
    );
    const match = dateRegex.exec(date);
    if (match != null) {
      return new PlainDateTime(
        I32.parseInt(match.matches[1]),
        // see https://github.com/ColinEberhardt/assemblyscript-regex/issues/38
        I32.parseInt(
          match.matches[2] != "" ? match.matches[2] : match.matches[19]
        ),
        I32.parseInt(
          match.matches[3] != "" ? match.matches[3] : match.matches[20]
        ),
        I32.parseInt(match.matches[4]),
        I32.parseInt(match.matches[5]),
        I32.parseInt(match.matches[6]),
        I32.parseInt(match.matches[7].substr(0, 3)),
        I32.parseInt(match.matches[7].substr(3, 3)),
        I32.parseInt(match.matches[7].substr(6, 3))
      );
    }
    throw new RangeError("invalid ISO 8601 string: " + date);
  }

  @inline
  static from<T>(date: T): PlainDateTime {
    if (isString<T>()) {
      // @ts-ignore: cast
      return this.fromString(<string>date);
    } else {
      if (isReference<T>()) {
        if (date instanceof PlainDateTime) {
          return this.fromPlainDateTime(date);
        } else if (date instanceof DateTimeLike) {
          return this.fromDateTimeLike(date);
        }
      }
      throw new TypeError("invalid date type");
    }
  }

  constructor(
    readonly year: i32,
    readonly month: i32,
    readonly day: i32,
    readonly hour: i32 = 0,
    readonly minute: i32 = 0,
    readonly second: i32 = 0,
    readonly millisecond: i32 = 0,
    readonly microsecond: i32 = 0,
    readonly nanosecond: i32 = 0
  ) {}

  @inline
  get dayOfWeek(): i32 {
    return dayOfWeek(this.year, this.month, this.day);
  }

  @inline
  get dayOfYear(): i32 {
    return dayOfYear(this.year, this.month, this.day);
  }

  @inline
  get weekOfYear(): i32 {
    return weekOfYear(this.year, this.month, this.day);
  }

  @inline
  get daysInWeek(): i32 {
    return 7;
  }

  @inline
  get daysInMonth(): i32 {
    return daysInMonth(this.year, this.month);
  }

  @inline
  get daysInYear(): i32 {
    return 365 + i32(leapYear(this.year));
  }

  @inline
  get monthsInYear(): i32 {
    return 12;
  }

  with(dateTimeLike: DateTimeLike): PlainDateTime {
    return new PlainDateTime(
      coalesce(dateTimeLike.year, this.year),
      coalesce(dateTimeLike.month, this.month),
      coalesce(dateTimeLike.day, this.day),
      coalesce(dateTimeLike.hour, this.hour),
      coalesce(dateTimeLike.minute, this.minute),
      coalesce(dateTimeLike.second, this.second),
      coalesce(dateTimeLike.millisecond, this.millisecond),
      coalesce(dateTimeLike.microsecond, this.microsecond),
      coalesce(dateTimeLike.nanosecond, this.nanosecond)
    );
  }

  toString(): string {
    // 1976-11-18T00:00:00
    return (
      this.year.toString() +
      "-" +
      toPaddedString(this.month) +
      "-" +
      toPaddedString(this.day) +
      "T" +
      toPaddedString(this.hour) +
      ":" +
      toPaddedString(this.minute) +
      ":" +
      toPaddedString(this.second) +
      (this.nanosecond != 0 || this.microsecond != 0 || this.millisecond != 0
        ? (
            f64(this.nanosecond) / 1_000_000_000.0 +
            f64(this.microsecond) / 1_000_000.0 +
            f64(this.millisecond) / 1_000.0
          )
            .toString()
            .substr(1)
        : "")
    );
  }

  static compare(a: PlainDateTime, b: PlainDateTime): i32 {
    if (a === b) return 0;

    return compareTemporalDateTime(
      a.year,
      a.month,
      a.day,
      a.hour,
      a.minute,
      a.second,
      a.millisecond,
      a.microsecond,
      a.nanosecond,
      b.year,
      b.month,
      b.day,
      b.hour,
      b.minute,
      b.second,
      b.millisecond,
      b.microsecond,
      b.nanosecond
    );
  }

  @inline
  equals(other: PlainDateTime): bool {
    if (this === other) return true;
    return (
      this.day == other.day &&
      this.month == other.month &&
      this.year == other.year &&
      this.hour == other.hour &&
      this.minute == other.minute &&
      this.second == other.second &&
      this.millisecond == other.millisecond &&
      this.microsecond == other.microsecond &&
      this.nanosecond == other.nanosecond
    );
  }

  add<T>(durationToAdd: T): PlainDateTime {
    const duration =
      durationToAdd instanceof DurationLike
        ? durationToAdd.toDuration()
        : // @ts-ignore TS2352
          (durationToAdd as Duration);

    const newDate = addDateTime(
      this.year,
      this.month,
      this.day,
      this.hour,
      this.minute,
      this.second,
      this.millisecond,
      this.microsecond,
      this.nanosecond,
      duration.years,
      duration.months,
      duration.weeks,
      duration.days,
      duration.hours,
      duration.minutes,
      duration.seconds,
      duration.milliseconds,
      duration.microseconds,
      duration.nanoseconds,
      Overflow.Constrain
    );
    return new PlainDateTime(
      newDate.year,
      newDate.month,
      newDate.day,
      newDate.hour,
      newDate.minute,
      newDate.second,
      newDate.millisecond,
      newDate.microsecond,
      newDate.nanosecond
    );
  }

  subtract<T>(durationToSubtract: T): PlainDateTime {
    const duration =
      durationToSubtract instanceof DurationLike
        ? durationToSubtract.toDuration()
        : // @ts-ignore TS2352
          (durationToSubtract as Duration);

    const newDate = addDateTime(
      this.year,
      this.month,
      this.day,
      this.hour,
      this.minute,
      this.second,
      this.millisecond,
      this.microsecond,
      this.nanosecond,
      -duration.years,
      -duration.months,
      -duration.weeks,
      -duration.days,
      -duration.hours,
      -duration.minutes,
      -duration.seconds,
      -duration.milliseconds,
      -duration.microseconds,
      -duration.nanoseconds,
      Overflow.Constrain
    );
    return new PlainDateTime(
      newDate.year,
      newDate.month,
      newDate.day,
      newDate.hour,
      newDate.minute,
      newDate.second,
      newDate.millisecond,
      newDate.microsecond,
      newDate.nanosecond
    );
  }
}
