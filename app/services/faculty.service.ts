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


@Injectable()
export class FacultyService {
	observable$: Observable<Faculty[]>;
	private observer: Observer<Faculty[]>;

	authService: AuthService;

	faculties: Faculty[] = [];

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService
	) {
		this.authService = AuthService;
		this.observable$ = new Observable<Faculty[]>(observer => this.observer = observer).share();

		let faculties = localStorage.getItem('faculties');
		if (typeof faculties !== 'undefined' && faculties !== null) {
			this.faculties = JSON.parse(faculties);
		} else {
			localStorage.setItem('faculties', JSON.stringify([]));
		}
	}

	triggerObservable() {
		this.observer.next(this.faculties);
	}

	getFaculties() {
		let [_, session] = this.authService.getSession();
		Promise.resolve(
			this.faculties.filter(
				(faculty) => faculty.user_id == session.id));
	}

	addFaculty(faculty: Faculty) {
		let [_, session] = this.authService.getSession();
		if (session.type == UserType.Student) {
			faculty.user_id = session.id;
			this.faculties.push(faculty);
			localStorage.setItem('faculties', JSON.stringify(this.faculties));
		}

		this.triggerObservable();
	}

	removeFaculty(i: number) {
		this.faculties.splice(i, 1);
		
		this.triggerObservable();
	}

	inFaculty(user: User): boolean {
		let i = this.faculties.map(faculty => faculty.faculty_id).indexOf(user.id);
		if (i < 0) { return false; }
		return true;
	}

	toggleFaculty(user: User): boolean {
		let i = this.faculties.map(faculty => faculty.faculty_id).indexOf(user.id);
		if (i < 0) {
			this.addFaculty({
				id: genId(),
				user_id: '',
				faculty_id: user.id
			});
			localStorage.setItem('faculties', JSON.stringify(this.faculties));
			return true;
		} else {
			this.removeFaculty(i);
			localStorage.setItem('faculties', JSON.stringify(this.faculties));
			return false;
		}
	}

}






// end