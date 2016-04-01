import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {LayoutHeader} from '../layouts/header.layout';
import {Calendar} from './calendar.component';
import {User, UserType} from '../interfaces/interface';

import {AuthService} from '../auth/auth.service';


@Component({
	selector: 'profile-context',
	template: `
		<div class="profile__context">
			<div class="row">
				<section>
					<ul>
						<li>
							<h4>{{ today }}</h4>
						</li>
					</ul>
				</section>
				<section>
					<ul>
						<li><a href="" class="lnr lnr-sync"></a></li>
						<li><a href="">Today</a></li>
						<li><a href="" class="lnr lnr-chevron-left"></a></li>
						<li><a href="" class="lnr lnr-chevron-right"></a></li>
					</ul>
				</section>
			</div>
		</div>
	`,
	directives: []
})
class ProfileContext implements OnInit {
	@Input() day: String = '';

	ngOnInit() {
	}

	get today() {
		let today = this.day.split("%");
		if (today.length === 3) {
			let date = new Date(parseInt(today[2]), parseInt(today[0]), parseInt(today[1]));
			return `${date.toString().match(/([\w]+\s){1,4}/i)[0].trim()}`;
		} else {
			return "date not valid";
		}
	}
}


@Component({
	template: `
		<profile-context></profile-context>
	`,
	directives: [ProfileContext]
})
class Cal {
}

@Component({
	template: `
		<h2>No one selected</h2>
	`
})
class None {}


@Component({
	selector: 'day-segment',
	template: `
		<profile-context [day]="day"></profile-context>
	`,
	directives: [ProfileContext]
})
class DaySegment implements OnInit {
	@Input() day: String = "";

	constructor(private _router: Router,
							private _routerParams: RouteParams) { }

	ngOnInit() {
		this.day = this._routerParams.get('day');
	}
}

@Component({
	selector: 'profile-nav',
	template: `
		<div class="profile__nav">
			<div class="profile__card" *ngIf="user">
				<img src="{{user.avatar}}" />
				<h3>{{user.fname}} {{user.lname}}</h3>
				<ul>
					<li><a href="">{{user.fname}}'s contact card</a></li>
					<li><a [routerLink]="['/ProfileViewport', 'DaySegment', {id: user.id, day: day}]">{{user.fname}}'s calendar</a></li>
					<li><a href="">My events with {{user.fname}}</a></li>
				</ul>
			</div>
			<calendar [id]="user.id"></calendar>
		</div>
	`,
	directives: [Calendar, RouterLink],
	providers: [AuthService]
})
class ProfileNav implements OnInit {
	@Input() user: User;
	day: String = '';

	constructor(private authService: AuthService,
							private router: Router) {}

	ngOnInit() {
		let [tokenExists, _] = this.authService.tokenExists();
		if (!(tokenExists)) {
			this.router.navigateByUrl('/');
			return;
		}

		let day = new Date();
		this.day = `${day.getMonth()}%${day.getDate()}%${day.getFullYear()}`;
	}
}


@Component({
	template: `
		<layout-header></layout-header>
		<div class="profile__viewport">
			<profile-nav [user]="user"></profile-nav>
			<div class="profile__outlet">
				<router-outlet></router-outlet>
			</div>
		</div>
	`,
	directives: [RouterLink, RouterOutlet, ProfileNav, LayoutHeader]
})
@RouteConfig([
	{ path: '/', name: 'None', component: None, useAsDefault: true },
	{ path: '/:id', name: 'Cal', component: Cal },
	{ path: '/:id/day/:day', name: 'DaySegment', component: DaySegment }
])
export class ProfileViewport implements OnInit {
	user: User;

	ngOnInit() {
		this.user = {
			id: '9486130',
			type: UserType.Faculty,
			fname: 'Taylor',
			lname: 'Swift',
			avatar: 'https://cdn.shopify.com/s/files/1/0521/5917/files/Screen_Shot_2016-03-20_at_4.35.11_PM.png?3896038397320089616'
		}
	}
}





