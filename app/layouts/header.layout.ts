import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

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
        	<h5>Search results:</h5>
        	<li *ngFor="#s of searchResults">
        		<a [routerLink]="['/ProfileViewport', 'CalendarRouter', {id: s.obj.id}]" class="search__user">
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
					id: '570d420c2d151a6c05377a1b', fname: "John", lname: "Doe", email: "john.doe@google.com",
					meta: {
						avatar: "https://cdn.shopify.com/s/files/1/0521/5917/files/Screen_Shot_2016-03-20_at_4.35.11_PM.png?3896038397320089616"
					}
				}
			},
			{
				type: SearchType.User, obj: {
					id: "570d428c71e3c07b05273552", fname: "Taylor", lname: "Swift", email: "taylor.swift@google.com",
					meta: {
						avatar: "https://cdn.shopify.com/s/files/1/0521/5917/files/Screen_Shot_2016-02-18_at_3.11.09_PM.png?5003393221482762451"
					}
				}
			},
			{
				type: SearchType.User, obj: {
					id: "570d42c28fd425820557ed99", fname: "Jane", lname: "Douglas", email: "jane.douglas@outsidexbox.com",
					meta: {
						avatar: "https://cdn.shopify.com/s/files/1/0521/5917/files/lady.png?8325253379137164394"
					}
				}
			},
			{
				type: SearchType.User, obj: {
					id: "570d425b5df05b74054b6087", fname: "Evie", lname: "Frye", email: "evie.frye@ubi.com", type: UserType.Faculty,
					meta: {
						avatar: "https://cdn.shopify.com/s/files/1/0521/5917/files/lady2.png?18444122143504349695"
					}
				}
			}
		]
	}
}


@Component({
	selector: 'layout-header',
	template: `
		<div class="app__top" *ngIf="user">
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
	session$: Observable<boolean>;
	show: boolean = false;

	constructor(
		private authService: AuthService
	) {}

	NAVS: Object[] = [
		{ location: ['/ProfileViewport'], lnr: 'calendar-full', text: 'Calendar' },
		{ location: ['/TemplateViewport'], lnr: 'layers', text: 'Templates' },
		{ location: ['/SegmentViewport'], lnr: 'file-add', text: 'Events' },
		{ location: ['/AuthComponent'], lnr: 'flag', text: 'Notifications' },
		{ location: ['/AuthComponent'], lnr: 'cog', text: 'Preferences' },
	]

	navs: Object[];

	update() {
		let [sessionExists, session] = this.authService.getSession();
		if (sessionExists) {
			this.user = session;
			if (session.type == UserType.Student) {
				// fix this!!!
				this.navs = [this.NAVS[0], this.NAVS[3], this.NAVS[4]];
			} else {
				this.navs = this.NAVS;
			}
		}
	}

	ngOnInit() {
		this.update();

		this.session$ = this.authService.session$;
		this.session$.subscribe(
			(response) => {
				if (!response) {
					this.user = null;
				} else {
					this.update();
				}
			});
	}
}