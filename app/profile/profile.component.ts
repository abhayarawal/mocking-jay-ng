import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {LayoutHeader} from '../layouts/header.layout';
import {Calendar} from './calendar.component';
import {User, UserType} from '../interfaces/interface';

import {AuthService} from '../auth/auth.service';
import {UserService} from '../services/user.service';
import {SegmentViewport} from './segment.component';


@Component({
	selector: 'profile-context',
	template: `
		<div class="profile__context">
			<div class="row">
				<section>
					<ul>
						<li>
							<a href="">
								Professors <span class="lnr lnr-chevron-down"></span>
							</a>
						</li>
						<li><a href="">Today's Events</a></li>
						<li><a class="selected" [routerLink]="['/ProfileViewport', 'DaySegment', {id: id, month: month, day: day, year: year}]">Calendar</a></li>
					</ul>
				</section>
				<section class="context__header">
					<h4>
						<span class="lnr lnr-star"></span>
						Taylor Swifts calendar
					</h4>
				</section>
				<section>
					<ul>
						<li><a href="" class="lnr lnr-sync"></a></li>
						<li><a href="">Today</a></li>
						<li><a (click)="prevDay()" class="lnr lnr-chevron-left"></a></li>
						<li><a (click)="nextDay()" class="lnr lnr-chevron-right"></a></li>
					</ul>
				</section>
			</div>
		</div>
	`,
	directives: [RouterLink]
})
class ProfileContext implements OnInit {
	@Input() day: string = "";
	@Input() month: string = "";
	@Input() year: string = "";
	@Input() id: string = "";

	constructor(private router: Router) {}

	getDate(year, month, day): Date {
		return new Date(parseInt(year), parseInt(month), (parseInt(day)));
	}

	prevDay(): void {
		let prev = this.getDate(this.year, this.month, parseInt(this.day)-1);
		this.router.navigateByUrl(`/calendar/${this.id}/day/${prev.getMonth()}/${prev.getDate()}/${prev.getFullYear()}`);
	}

	nextDay(): void {
		let next = this.getDate(this.year, this.month, parseInt(this.day)+1);
		this.router.navigateByUrl(`/calendar/${this.id}/day/${next.getMonth()}/${next.getDate()}/${next.getFullYear()}`);
	}

	ngOnInit() {
	}

	get today() {
		let date = this.getDate(this.year, this.month, this.day);
		return `${date.toString().match(/([\w]+\s){1,4}/i)[0].trim()}`;
	}
}

@Component({
	selector: 'profile-nav',
	template: `
		<div class="profile__nav">
			<div class="profile__card" *ngIf="user">
				<img src="{{user.meta?.avatar}}" />
				<h3>
					{{user.fname}} {{user.lname}}
				</h3>
				<div class="profile__mail"><a href="mailto:{{user.email}}">{{user.email}}</a></div>
				<ul>
					<li *ngIf="type==0 && user.type!=0">
						<a href="" class="lnr lnr-pushpin"></a>
					</li>
					<li><a class="lnr lnr-license"></a></li>
					<li><a [routerLink]="['/ProfileViewport', 'Calendar', {id: user.id}]" class="lnr lnr-calendar-full"></a></li>
					<li><a href="" class="lnr lnr-download"></a></li>
				</ul>
			</div>
			<calendar [id]="user.id" *ngIf="user"></calendar>
		</div>
	`,
	directives: [Calendar, RouterLink]
})
class ProfileNav implements OnInit {
	@Input() user: User;
	day: String = '';
	month: String = '';
	year: String = '';

	type: UserType;

	constructor(
		private authService: AuthService,
		private router: Router
	) { }

	ngOnInit() {
		let day = new Date();
		this.day = `${day.getDate()}`;
		this.month = `${day.getMonth()}`;
		this.year = `${day.getFullYear()}`;

		let [_, session] = this.authService.getSession();
		this.type = session.type;
	}
}

@Component({
	template: `
		<profile-nav [user]="user"></profile-nav>
		<div class="profile__outlet">
			<h2>Viewing</h2>
		</div>
	`,
	directives: [ProfileNav]
})
class Cal implements OnInit {
	user: User;

	constructor(
		private userService: UserService,
		private routeParams: RouteParams
	) { }

	ngOnInit() {
		let id = this.routeParams.get('id');
		this.userService.getUser(id).then(user => this.user = user);
	}
}

@Component({
	template: `
		<profile-nav [user]="user"></profile-nav>
		<div class="profile__outlet">
			<h2>Upcoming events</h2>
		</div>
	`,
	directives: [ProfileNav]
})
class None implements OnInit{
	user: User;

	constructor(
		private userService: UserService,
		private routeParams: RouteParams
	) { }

	ngOnInit() {
		this.userService.getUser().then(user => this.user = user);
	}
}


@Component({
	selector: 'day-segment',
	template: `
		<profile-nav [user]="user"></profile-nav>
		<div class="profile__outlet">
			<profile-context [id]="id" [month]="month" [year]="year" [day]="day"></profile-context>
			<segment-viewport [id]="id" [month]="month" [year]="year" [day]="day"></segment-viewport>
		</div>
	`,
	directives: [ProfileContext, SegmentViewport, ProfileNav]
})
class DaySegment implements OnInit {
	@Input() day: String = "";
	@Input() month: String = "";
	@Input() year: String = "";
	id: string = "";
	user: User;

	constructor(
		private router: Router,
		private routerParams: RouteParams,
		private userService: UserService
	){}

	ngOnInit() {
		this.day = this.routerParams.get('day');
		this.month = this.routerParams.get('month');
		this.year = this.routerParams.get('year');
		this.id = this.routerParams.get('id');

		this.userService.getUser(this.id).then(user => this.user = user);
	}
}


@Component({
	template: `
		<layout-header></layout-header>
		<div class="profile__viewport">
			<router-outlet></router-outlet>
		</div>
	`,
	directives: [RouterLink, RouterOutlet, LayoutHeader]
})
@RouteConfig([
	{ path: '/', name: 'None', component: None, useAsDefault: true },
	{ path: '/:id', name: 'Calendar', component: Cal },
	{ path: '/:id/day/:month/:day/:year', name: 'DaySegment', component: DaySegment }
])
export class ProfileViewport {
}





