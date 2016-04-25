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
	data: string,
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
				{{alternate.data}}
			</h5>
			<div *ngIf="!alternate.activated" class="activation">
				<strong>Not activated yet.</strong>
				<a>Send another activation code</a>
				<div class="form__group">
					<input type="text" placeholder="Activation code" />
					<button>Activate</button>
				</div>
			</div>
			<div class="ctls" *ngIf="alternate.activated">
				<section>
					<label>Show in contact card?</label>
					<radius-radio [intext]="true" [on]="alternate.show"></radius-radio>
				</section>
				<section>
					<label>Use for notification?</label>
					<radius-radio [intext]="true" [on]="alternate.notification"></radius-radio>
				</section>
			</div>
		</div>
	`,
	directives: [RadiusRadioComponent]
})
class AlternatePref {
	@Input() alternate: Alternate;
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
						<input type="text" placeholder="john.doe@example.com" />
					</div>
					<div class="form__group">
						<alternate-pref *ngFor="#ae of emails" [alternate]="ae"></alternate-pref>
					</div>
					
					<div class="form__group">
						<h5 class="form__title">Phone preferences:</h5>
						<label>Add a new phone</label>
						<input type="text" placeholder="000-000-0000" />
					</div>
					<div class="form__group">
						<alternate-pref *ngFor="#ap of phones" [alternate]="ap"></alternate-pref>
					</div>
				</form>
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
				</ul>
			</div>
		</div>
	`,
	directives: [AlternatePref]
})
class PreferencesForm implements OnInit {
	user: User;
	emails: Alternate[] = [
		{ data: 'theblueone@smurf.com', show: true, notification: false, activated: true, type: AlternateType.Email },
		{ data: 'katy.perry@music.com', show: true, notification: false, activated: false, type: AlternateType.Email },
	];

	phones: Alternate[] = [
		{ data: '123-456-7890', show: true, notification: true, activated: true, type: AlternateType.Phone },
	];

	constructor(
		private fb: FormBuilder,
		private router: Router,
		private notificationService: NotificationService,
		private userService: UserService,
		private authService: AuthService
	) {
	}

	ngOnInit() {
		let [exists, session] = this.authService.getSession();

		if (exists) {
			this.userService.getUserPromise(session.id).then((response) => {
				if (response.success) {
					this.user = response.payload;
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