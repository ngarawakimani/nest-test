import { Helpers } from './../shared/helpers';
import { Injectable, HttpService, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { TimeEntryObjectDto } from './dto/time.entry.object.dto';
import { TimeEntriesProjectsDto } from './dto/time.entries.projects.dto';
import { TimeEntriesUsersDto } from './dto/time.entries.users.dto';

@Injectable()
export class TimeEntriesService {
  /**
   * @private
   * @type {any}
   * @memberof TimeEntriesService
   */
  private responseArray: any;

  constructor(private httpService: HttpService, private helpers: Helpers) {
    this.responseArray = [];
  }

  /**
   * Get all projects
   *
   * @returns {Promise<Observable<any>>}
   */
  async getProjects(): Promise<Observable<any>> {
    return await this.httpService
      .get(`projects.json`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get all users in the "software" team group
   *
   * @returns {Promise<Observable<any>>}
   */
  async getUsers(): Promise<Observable<any>> {
    return await this.httpService
      .get(`groups/12.json?include=users`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get all issues on issues
   *
   * @returns Promise<Observable<any>>
   */
  async getIssues(): Promise<Observable<any>> {
    return await this.httpService
      .get(`issues.json`)
      .pipe(map((response) => response.data));
  }

  /**
   * Make a time entry of a user per project
   *
   * @param {Object} data
   * @returns {Promise<Observable<any>>}
   */
  async createTimeEntryOfUserPerProject(data: any): Promise<Observable<any>> {
    const payload = {
      project_id: data.projectId,
      spent_on: data.spentOn,
      time_entry: {
        hours: data.hours,
      },
      comments: data.projectId,
      user_id: data.userId,
    };
    return await this.httpService
      .post(`time_entries.json`, payload)
      .pipe(map((response) => response.data));
  }

  /**
   * Make time entries of a user per project
   *
   * @param {Object} data
   * @returns {Promise<Observable<any>>}
   */
  async createTimeEntriesOfUserPerProject(data: any): Promise<Observable<any>> {
    for (let i = 0; i < data.entries.length; i++) {
      const validationObject = {
        spentOn: data.entries[i].spentOn,
        hours: data.entries[i].hours,
        comments: data.entries[i].comments,
      };

      const payload = {
        project_id: data.projectId,
        spent_on: data.entries[i].spentOn,
        time_entry: {
          hours: data.entries[i].hours,
        },
        comments: data.entries[i].comments,
        user_id: data.userId,
      };

      await this.sendTimeEntriesRequests(
        validationObject,
        payload,
        TimeEntryObjectDto,
      );
    }
    return await this.postEntries(this.responseArray).pipe(
      map((response) => this.helpers.entriesMapTransformer(response)),
    );
  }

  /**
   * Make time entries of a user in multiple projects
   *
   * @param {Object} data
   * @returns {Promise<Observable<any>>}
   */
  async createTimeEntriesOfUserMultiProjects(
    data: any,
  ): Promise<Observable<any>> {
    for (let i = 0; i < data.entries.length; i++) {
      const validationObject = {
        projectId: data.entries[i].projectId,
        spentOn: data.entries[i].spentOn,
        hours: data.entries[i].hours,
        comments: data.entries[i].comments,
      };

      const payload = {
        project_id: data.entries[i].projectId,
        spent_on: data.entries[i].spentOn,
        time_entry: {
          hours: data.entries[i].hours,
        },
        comments: data.entries[i].comments,
        user_id: data.userId,
      };

      await this.sendTimeEntriesRequests(
        validationObject,
        payload,
        TimeEntriesProjectsDto,
      );
    }
    return await this.postEntries(this.responseArray).pipe(
      map((response) => this.helpers.entriesMapTransformer(response)),
    );
  }

  /**
   * Make time entries of users in a project
   *
   * @param {Object} data
   * @returns {Promise<Observable<any>>}
   */
  async createTimeEntriesOfUsersPerProject(
    data: any,
  ): Promise<Observable<any>> {
    for (let i = 0; i < data.entries.length; i++) {
      const validationObject = {
        userId: data.entries[i].userId,
        spentOn: data.entries[i].spentOn,
        hours: data.entries[i].hours,
        comments: data.entries[i].comments,
      };

      const payload = {
        project_id: data.projectId,
        spent_on: data.entries[i].spentOn,
        time_entry: {
          hours: data.entries[i].hours,
        },
        comments: data.entries[i].comments,
        user_id: data.entries[i].userId,
      };

      await this.sendTimeEntriesRequests(
        validationObject,
        payload,
        TimeEntriesUsersDto,
      );
    }

    return await this.postEntries(this.responseArray).pipe(
      map((response) => this.helpers.entriesMapTransformer(response)),
    );
  }

  /**
   * Send time entries requests
   *
   * @param {Object} validationObject
   * @param {Object} payload
   * @param {Class} dto
   * @returns {Promise<void>}
   */
  async sendTimeEntriesRequests(
    validationObject: any,
    payload: any,
    dto: any,
  ): Promise<void> {
    const errors = await validate(plainToClass(dto, validationObject));

    if (errors.length > 0) {
      throw new HttpException(
        {
          message: 'Input data validation failed',
          errors: this.helpers.buildError(errors),
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    this.responseArray.push(
      this.httpService.axiosRef.post(`time_entries.json`, payload),
    );
  }

  /**
   * Make time entries requests
   *
   * @param {Object} data
   * @returns {Observable<any>}
   */
  postEntries(data?: any): Observable<any> {
    return new Observable<any>((subscriber) => {
      Promise.all(data)
        .then((res) => {
          subscriber.next(res);
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }
}
