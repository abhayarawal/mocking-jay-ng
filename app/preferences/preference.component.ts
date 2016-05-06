import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';


import {User, UserType} from '../interfaces/interface';
import {NotificationService, Notification} from '../notification.service';

import {AuthService} from '../auth/auth.service';
import {UserService} from '../services/user.service';
import {RadiusInputComponent, RadiusSelectComponent, RadiusRadioComponent} from '../form/form.component';

enum AlternateType {
	Phone,
	Email
}

interface Alternate {
	_id: string,
	email: string,
	show: boolean,
	notification: boolean,
	activated: boolean,
	type: AlternateType
}


@Component({
	selector: 'alternate-pref',
	template: `
		<div class="email__pref" *ngIf="alternate">
			<h5>
				<span class="icon-mail" *ngIf="alternate.type==1"></span>
				<span class="icon-phone" *ngIf="alternate.type==0"></span>
				{{alternate.email}}
			</h5>
			<div *ngIf="!alternate.activated" class="activation">
				<strong>Not activated yet.</strong>
				<a>Send another activation code</a>
				<div class="form__group">
					<input type="text" placeholder="Activation code" [(ngModel)]="code" />
					<button (click)="activate()">Activate</button>
				</div>
			</div>
			<div class="ctls" *ngIf="alternate.activated">
				<section>
					<label>Show in contact card?</label>
					<radius-radio [intext]="true" [on]="alternate.show" (update)="updateShow($event)"></radius-radio>
				</section>
				<section>
					<label>Use for notification?</label>
					<radius-radio [intext]="true" [on]="alternate.notification" (update)="updateNot($event)"></radius-radio>
				</section>
			</div>
		</div>
	`,
	directives: [RadiusRadioComponent]
})
class AlternatePref {
	@Input() alternate: Alternate;
	code: string = "";

	constructor(
		private notificationService: NotificationService,
		private userService: UserService,
		private authService: AuthService,
		private http: Http
	) {
	}

	activate() {
		this.userService.activate(this.alternate._id, this.code).then((response) => {
			if (response.success) {
				this.alternate.activated = true;
				this.notificationService.notify(`${response.message}`, true);
			} else {
				this.notificationService.notify(`${response.message}`, true, true);
			}
		});
	}

	updatePref() {
		this.http.patch(
			`${this.authService.baseUri}/users/email`,
			JSON.stringify({
				id: this.alternate._id,
				show: this.alternate.show,
				notification: this.alternate.notification
			}),
			{ headers: this.authService.getAuthHeader() })
			.map(res => res.json())
			.toPromise()
			.then((response) => {
			});
	}

	updateShow(next) {
		this.alternate.show = next;
		this.updatePref();
	}

	updateNot(next) {
		this.alternate.notification = next;
		this.updatePref();
	}
}


@Component({
	selector: 'preferences-form',
	template: `
		<div class="contextual__form">
			<h4 class="form__lnr">
				<span class="lnr lnr-pencil"></span>
				Modify your preferences
			</h4>
			<div class="form__wrap pref__form">
				<form>
					<div class="form__group">
						<h5 class="form__title">Email preferences:</h5>
						<label>Add a new email</label>
						<input type="text" [(ngModel)]="email" placeholder="john.doe@example.com" />
						<div>
							<button class="button type__2" (click)="newMail()">
								<span class="icon-done"></span>
								Add email
							</button>
						</div>
					</div>
				</form>
				<div class="form__group">
					<alternate-pref *ngFor="#ae of emails" [alternate]="ae"></alternate-pref>
				</div>
			</div>
		</div>

		<div class="contextual__card">
			<div class="contact__card" *ngIf="user">
				<section class="avatar">
					<img src="{{user.meta?.avatar}}" *ngIf="user.meta.avatar" alt="" />
					<span *ngIf="!user.meta.avatar">AR</span>
				</section>
				<h3>{{user.lname}}, {{user.fname}}</h3>
				<ul class="email">
					<li>{{user.email}}</li>
					<li *ngFor="#mail of user.meta.emails" *ngIf="user.meta.emails">
						{{mail?.email}}
					</li>
				</ul>
			</div>
		</div>
	`,
	directives: [AlternatePref]
})
class PreferencesForm implements OnInit {
	user: User;
	email: string = "";
	emails: Alternate[] = [];

	emailValidator = /^[a-z0-9-_\.]+@[a-z0-9-]+(\.\w+){1,4}$/i;

	constructor(
		private fb: FormBuilder,
		private router: Router,
		private notificationService: NotificationService,
		private userService: UserService,
		private authService: AuthService
	) {
	}

	newMail() {
		if (this.email.length > 0) {
			if (this.emailValidator.test(this.email)) {
				this.userService.addEmail(this.email).then((response) => {
					if (response.success) {
						this.email = "";
						this.notificationService.notify(`Alternate email successfully added`, true);

						this.emails = response.payload.meta.emails.map((email) => {
							return {
								_id: email._id,
								email: email.email,
								show: email.show,
								notification: email.notification,
								type: AlternateType.Email,
								activated: email.activated
							}
						});
					} else {
						this.notificationService.notify(`${response.message}`, true, true);
					}
				});
			} else {
				this.notificationService.notify(`${this.email} is not a valid email`, true, true);
			}
		}
	}

	ngOnInit() {
		let [exists, session] = this.authService.getSession();

		if (exists) {
			this.userService.getUserPromise(session.id).then((response) => {
				if (response.success) {
					this.user = response.payload;
					this.emails = response.payload.meta.emails.map((email) => {
						return {
							_id: email._id,
							email: email.email,
							show: email.show,
							notification: email.notification,
							type: AlternateType.Email,
							activated: email.activated
						}
					});
				}
			});
		}
	}

	get json() {
		return JSON.stringify(this.user);
	}

}


@Component({
	selector: 'contextual-menu',
	template: `
		<div class="contextual__menu">
			<h4>Preferences</h4>
		</div>
	`,
	directives: [RouterLink]
})
class ContextualMenu {
}


@Component({
	template: `
		<div class="wrapping__viewport">
			<contextual-menu></contextual-menu>
			<div class="wrapping__content type__2">
				<preferences-form></preferences-form>
			</div>
		</div>
	`,
	directives: [RouterLink, ContextualMenu, PreferencesForm]
})
export class PreferencesViewport {
}