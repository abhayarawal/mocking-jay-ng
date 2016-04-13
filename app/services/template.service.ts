import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {Template, UserType} from '../interfaces/interface';

import {AuthService} from '../auth/auth.service';

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};

export interface Notification {
	message: string,
	type: boolean
}


@Injectable()
export class TemplateService implements OnInit {
	templates: Template[];

	templates$: Observable<Template[]>;
	private templatesObserver: Observer<Template[]>;

	notification$: Observable<Notification>;
	private notificationObserver: Observer<Notification>;


	authService: AuthService;
	getTemplatesPending;

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService
	) {
		this.authService = AuthService;

		this.templates$ = new Observable<Template[]>(observer => this.templatesObserver = observer).share();
		this.notification$ = new Observable<Notification>(observer => this.notificationObserver = observer).share();

		let templates = localStorage.getItem('templates');
		if (typeof templates !== 'undefined' && templates !== null) {
			this.templates = JSON.parse(templates);
		} else {
			localStorage.setItem('templates', JSON.stringify([]));
		}
	}

	triggerObserve() {
		this.templatesObserver.next(this.templates);
	}

	getTemplates(id: string) {
		if (this.getTemplatesPending) {
			this.getTemplatesPending.unsubscribe();
		}

		let headers = this.authService.getAuthHeader();
		this.getTemplatesPending = this.http.get(
			`${this.authService.baseUri}/templates/${id}`, {
				headers: headers,
			})
			.map(res => res.json())
			.subscribe(
				(response) => {
					let templates = response.map((template) => {
						template.id = template._id;
						delete template._id;
						return template;
					});
					this.templatesObserver.next(templates);
				},
				err => {
					this.notificationObserver.next({
						type: false,
						message: 'Error connecting to server'
					})
				}
			);
	}

	getTemplate(id: string) {
		return Promise.resolve(
			(this.templates.filter(template => template.id === id))[0]
		);
	}

	getTemplateSync(id: string) {
		return (this.templates.filter(template => template.id === id))[0];
	}

	addTemplate(template: Template) {
		let [sessionExist, session] = this.authService.getSession();
		if (sessionExist) {
			if (session.type == UserType.Faculty && session.id) {
				let authHeader = this.authService.getAuthHeader();

				this.http.post(`${this.authService.baseUri}/templates/`, JSON.stringify(template), {
					headers: authHeader
				})
				.map(res => res.json())
				.subscribe(
					(data) => {
						if (data.success) {
							this.notificationObserver.next({
								message: 'Template has been saved',
								type: true
							});
						} else {
							console.log(data.payload);
							this.notificationObserver.next({
								message: 'Could not save template',
								type: false
							});
						}
					},
					err => {
						this.notificationObserver.next({
							message: 'Error connecting to server',
							type: false
						});
					}
				);
			}
		}
	}

	removeTemplate(id: string) {
		let [sessionExist, session] = this.authService.getSession();
		if (sessionExist) {
			let authHeaders = this.authService.getAuthHeader();
			this.http.delete(`${this.authService.baseUri}/templates/${id}`, {
				headers: authHeaders
			})
			.map(res => res.json())
			.subscribe(
				(response) => {
					if (response.success) {
						this.notificationObserver.next({
							type: true,
							message: 'Template has been removed'
						});
						this.getTemplates(session.id);
					} else {
						this.notificationObserver.next({
							type: false,
							message: 'Could not remove template'
						});
					}
				},
				err => {
					this.notificationObserver.next({
						type: false,
						message: 'Error connecting to server'
					});
				});
		}

		// let index = this.templates.map(template => template.id).indexOf(id);
		// if (index >= 0 && index < this.templates.length) {
		// 	this.templates.splice(index, 1);
		// 	localStorage.setItem('templates', JSON.stringify(this.templates));
		// 	this.triggerObserve();
		// }
	}

	getNewTemplate() {
		let template: Template = {
			id: "",
			name: "",
			interval: 15,
			allow_multiple: false,
			require_accept: true,
			_user: ""
		};

		return Promise.resolve(template);
	}

	ngOnInit() {
	}
}








// end