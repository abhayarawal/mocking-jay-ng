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
 


@Component({
	selector: 'preferences-form',
	template: `
		<div class="contextual__form">
			<h4 class="form__lnr">
				<span class="lnr lnr-pencil"></span>
				Modify your preferences
			</h4>
			<div class="form__wrap">
			</div>
		</div>

		<div class="contextual__card">
			<div class="contact__card" *ngIf="user">
				<section class="avatar">
					<img src="{{user.meta?.avatar}}" *ngIf="user.meta.avatar" alt="" />
					<span *ngIf="!user.meta.avatar">AR</span>
				</section>
				<h3>{{user.lname}}, {{user.fname}}</h3>
				<div class="email">
					
				</div>
			</div>
		</div>
	`,
	directives: []
})
class PreferencesForm implements OnInit {

	user: User;

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