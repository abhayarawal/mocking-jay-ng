import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {AuthService, Notification} from './auth.service';
import {NotificationService} from '../notification.service';


interface ValidationResult {
	[key: string]: boolean;
}

class AuthValidator {
	static isUsername(control: Control): ValidationResult {
		let validation = control.value.trim().match(/^[a-z0-9-_\.]+$/i);
		if (!validation) {
			return { "isUsername": true };
		}
		return null;
	}
}

@Component({
	template: ``
})
export class LogoutComponent implements OnInit {
	constructor(
		private authService: AuthService,
		private router: Router,
		private notificationService: NotificationService
	) { }

	ngOnInit() {
		this.authService.deleteJwt();
		this.authService.deleteSession();
		this.router.navigateByUrl('/');
		this.notificationService.notify('Session Expired', true, true);
	}
}

@Component({
	template: `
		<div class="auth">
			<h2>Log in</h2>
			<form [ngFormModel]="authForm">
				<div class="form__group">
					<label>Username:</label>
					<input type="text" ngControl="username" placeholder="tovelo" />
				</div>
				<div class="form__group">
					<label>Password:</label>
					<input type="password" ngControl="password" placeholder="dummy" />
				</div>
				<div class="form__group">
					<button (click)="auth()" class="button type__1">Login</button>
					<button (click)="faculty()" class="button type__4">Faculty</button>
					<button (click)="taylor()" class="button type__4">Taylor</button>
				</div>
			</form>
			<!--<div *ngIf="notification">
				{{ notification.message }} --- {{ notification.type }}
			</div>-->
		</div>
	`
})
export class AuthComponent implements OnInit {
	username: Control;
	password: Control;
	authForm: ControlGroup;

	notification: Notification;
	observable: Observable<Notification>;

	constructor(
		private router: Router,
		private authService: AuthService,
		private builder: FormBuilder,
		private notificationService: NotificationService
	){
		this.username = new Control('', Validators.compose([
			Validators.required, Validators.minLength(3), AuthValidator.isUsername
		]));

		this.password = new Control('', Validators.compose([
			Validators.required, Validators.minLength(3)
		]));

		this.authForm = builder.group({
			'username': this.username,
			'password': this.password
		});
	}

	ngOnInit() {
		let [tokenExists, _] = this.authService.tokenExists();
		if (tokenExists) {
			this.router.navigateByUrl('/calendar');
			return;
		}

		this.observable = this.authService.notification$;
		this.observable.subscribe(
			data => {
				if (data.type) {
					this.router.navigateByUrl('/calendar/');
				} else {
					this.notification = data;
					this.notificationService.notify(this.notification.message, true, true);
				}
			}
		)
	}

	auth(): void {
		if (this.authForm.valid) {
			this.authService.authenticate(this.authForm.value);
			this.notificationService.notify('Authentication successful', true);
		} else {
			this.notification = {
				message: `Username or password not valid`,
				type: false
			}

			this.notificationService.notify(this.notification.message, true, true);

		}
	}

	faculty() {
		this.authService.authenticate({username: 'faculty', password: 'dummy'});
		this.notificationService.notify('Authenticated as faculty', true);
	}

	taylor() {
		this.authService.authenticate({ username: 'tovelo', password: 'dummy' });
		this.notificationService.notify('Authenticated as Taylor', true);
	}
}
