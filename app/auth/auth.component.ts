import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {AuthService, Notification} from './auth.service';

@Component({
	template: `
		<div class="auth">
			<h2>Log in</h2>
			<form (ngSubmit)="auth()">
				<div class="form__group">
					<label for="">Username:</label>
					<input type="text" [(ngModel)]="username" id="" placeholder="tovelo" />
				</div>
				<div class="form__group">
					<label for="">Password:</label>
					<input type="password" [(ngModel)]="password" id="" placeholder="dummy" />
				</div>
				<div class="form__group">
					<button type="submit" class="button type__1">Login</button>
				</div>
			</form>
			<div *ngIf="notification">
				{{ notification.message }}
			</div>
		</div>
	`,
	providers: [AuthService]
})
export class AuthComponent implements OnInit {
	username: string = '';
	password: string = '';

	notification: Notification;
	observable: Observable<Notification>;

	constructor(private router: Router,
							private authService: AuthService) {}

	ngOnInit() {
		this.observable = this.authService.notification$;
		this.observable.subscribe(
			data => {
				if (data.type) {
					this.router.navigateByUrl('/calendar/');
				} else {
					this.notification = data;
				}
			}
		)
	}

	auth(): void {
		let username = this.username.trim(),
				password = this.password.trim();

		if (username.length > 0 && password.length > 0) {
			this.authService.authenticate(username, password);
		} else {
			this.notification = {
				message: `hey! username and password not valid`,
				type: false
			}
		}
	}
}
