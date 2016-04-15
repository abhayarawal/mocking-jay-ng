import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {User, UserType, Faculty} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';


var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};

export interface Notification {
	message: string,
	type: boolean
}

@Injectable()
export class FacultyService {
	observable$: Observable<Faculty[]>;
	private observer: Observer<Faculty[]>;

	notification$: Observable<Notification>;
	private notificationObserver: Observer<Notification>;

	authService: AuthService;

	faculties: Faculty[] = [];

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService
	) {
		this.authService = AuthService;
		this.observable$ = new Observable<Faculty[]>(observer => this.observer = observer).share();
		this.notification$ = new Observable<Notification>(observer => this.notificationObserver = observer).share();
	}


	getFaculties() {
		this.http.get(
			`${this.authService.baseUri}/faculty/`,
			{ 
				headers: this.authService.getAuthHeader() 
			})
			.map(res => res.json())
			.subscribe(
				(response) => {
					this.faculties = response;
					this.observer.next(response);
				});
	}

	private addFaculty(faculty: Faculty) {
		this.http.post(
			`${this.authService.baseUri}/faculty/`,
			JSON.stringify(faculty),
			{
				headers: this.authService.getAuthHeader()
			})
			.map(res => res.json())
			.subscribe(
				(response) => {
					if (response.success) {
						this.notificationObserver.next({
							type: true,
							message: 'Faculty has been pinned'
						});
					} else {
						this.notificationObserver.next({
							type: false,
							message: 'Sorry, something went wrong'
						});
					}
					this.getFaculties();
				});
	}

	removeFaculty(index: number) {
		this.http.delete(
			`${this.authService.baseUri}/faculty/${this.faculties[index]._id}`,
			{
				headers: this.authService.getAuthHeader()
			})
			.map(res => res.json())
			.subscribe(
				(response) => {
					console.log(response);
					if (response.success) {
						this.notificationObserver.next({
							type: true,
							message: 'Faculty has been unpinned'
						});
					} else {
						this.notificationObserver.next({
							type: false,
							message: 'Sorry, something went wrong'
						});
					}
					this.getFaculties();
				});
	}

	inFaculty(user: User): [boolean, number] {
		let [_, session] = this.authService.getSession();
		let index: number = -1;

		for (var i = this.faculties.length - 1; i >= 0; i--) {
			let faculty = this.faculties[i];
			if (faculty._user == session.id && faculty._faculty == user.id) {
				index = i;
				break;
			}
		}

		if (index < 0) {
			return [false, index];
		} else {
			return [true, index];
		}
	}

	toggleFaculty(user: User) {
		let [_, session] = this.authService.getSession();
		let [inFaculty, index] = this.inFaculty(user);

		if (!inFaculty) {
			this.addFaculty({
				_id: "",
				_user: session.id,
				_faculty: user.id
			});
		} else {
			this.removeFaculty(index);
		}
	}

}






// end