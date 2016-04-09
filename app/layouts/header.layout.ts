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


enum SearchType {
	User,
	Date,
	UserDate,
	Help
}

interface SearchResult {
	type: SearchType,
	obj: {}
}

@Component({
	selector: 'search-box',
	template: `
		<form>
			<div class="search__box">
				<span class='lnr lnr-magnifier'></span>
        <input placeholder='Search for anything' type='text' (focus)="show=true" (blur)="hide()">

        <ul class="search__results" [ngClass]="{show: show}">
        	<li *ngFor="#s of searchResults">
        		<a [routerLink]="['/ProfileViewport', 'Calendar', {id: s.obj.id}]" class="search__user">
							<img src="{{s.obj.meta?.avatar}}" alt="" />
							<h3>
								{{s.obj.fname}} {{s.obj.lname}}
								<span>{{s.obj.email}}</span>
							</h3>
        		</a>
        	</li>
        </ul>
			</div>
		</form>
	`,
	directives: [RouterLink]
})
class SearchBox implements OnInit {
	searchResults: SearchResult[];
	show: boolean = false;
	timeout: any;

	hide() {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => { this.show = false; }, 250);
	}

	ngOnInit() {
		this.searchResults = [
			{
				type: SearchType.User, obj: {
					id: 'ekny5h2qd', fname: "John", lname: "Doe", email: "john.doe@google.com",
					meta: {
						avatar: "https://cdn.shopify.com/s/files/1/0521/5917/files/Screen_Shot_2016-03-20_at_4.35.11_PM.png?3896038397320089616"
					}
				}
			},
			{
				type: SearchType.User, obj: {
					id: "czrvbw1fz", fname: "Taylor", lname: "Swift", email: "taylor.swift@google.com",
					meta: {
						avatar: "https://cdn.shopify.com/s/files/1/0521/5917/files/Screen_Shot_2016-02-18_at_3.11.09_PM.png?5003393221482762451"
					}
				}
			}
		]
	}
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