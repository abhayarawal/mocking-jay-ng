import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {User, UserType} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';

@Component({
	selector: 'main-nav',
	template: `
		<ul class="main__nav" *ngIf="navs">
			<li *ngFor="#nav of navs">
				<a [routerLink]="nav.location">
          <span class='lnr lnr-{{nav.lnr}}'></span>
          <em>{{nav.text}}</em>
        </a>
			</li>
			<li *ngIf="user">
				{{user.fname}} {{user.lname}}
				<a [routerLink]="['/LogoutComponent']"><img src="{{user.meta.avatar}}" /></a>
				<span class="lnr lnr-chevron-down"></span>
			</li>
		</ul>
	`,
	directives: [RouterLink]
})
class MainNav {
	@Input() user: User;
	@Input() navs: Object[];
}


@Component({
	selector: 'search-box',
	template: `
		<form>
			<div class="search__box">
				<span class='lnr lnr-magnifier'></span>
        <input placeholder='Search for anything' type='text'>
			</div>
		</form>
	`
})
class SearchBox {
}


@Component({
	selector: 'layout-header',
	template: `
		<div class="app__top">
			<div class="row">
				<div class="top__left">
					<div>
						<img src="https://cdn.shopify.com/s/files/1/0521/5917/files/mj__logo.png?714379856798195830" alt="" />
					</div>
				</div>
				<div class="top__search">
					<search-box></search-box>
				</div>
				<div class="top__right">
					<main-nav [user]="user" [navs]="navs"></main-nav>
				</div>
			</div>
		</div>
	`,
	directives: [SearchBox, MainNav]
})
export class LayoutHeader implements OnInit {
	user: User;

	constructor(
		private authService: AuthService
	) {}

	navs: Object[] = [
		{ location: ['/ProfileViewport'], lnr: 'calendar-full', text: 'Calendar' },
		{ location: ['/TemplateViewport'], lnr: 'layers', text: 'Templates' },
		{ location: ['/SegmentViewport'], lnr: 'file-add', text: 'Events' },
		{ location: ['/ProfileViewport'], lnr: 'flag', text: 'Notifications' },
		{ location: ['/ProfileViewport'], lnr: 'cog', text: 'Preferences' },
	]

	ngOnInit() {
		let [sessionExists, session] = this.authService.getSession();
		if (sessionExists) {
			this.user = session;

			if (session.type == UserType.Student) {
				this.navs.splice(1, 2);
			}
		}
	}
}