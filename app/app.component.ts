import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams} from 'angular2/router';

import {ProfileViewport} from './profile/profile.component';
import {User, UserType} from './interfaces/interface';

@Component({
	template: `
		<h2>Latest Activities</h2>
	`
})
export class ActivityViewport {
}



@Component({
	selector: 'main-nav',
	template: `
		<ul class="main__nav" *ngIf="navs">
			<li *ngFor="#nav of navs">
				<a href='{{nav.location}}'>
          <span class='lnr lnr-{{nav.lnr}}'></span>
        </a>
			</li>
			<li *ngIf="user">
				{{user.fname}} {{user.lname}}
				<img src="{{user.avatar}}" />
				<span class="lnr lnr-chevron-down"></span>
			</li>
		</ul>
	`
})
export class MainNav {
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
export class SearchBox {
}


@Component({
	selector: 'layout-header',
	template: `
		<div class="app__top">
			<div class="row">
				<div class="top__left">&nbsp;</div>
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
export class LayoutHeader {
	user: User = {
		id: "1803710",
		type: UserType.Student,
		fname: "John",
		lname: "Doe",
		avatar: "https://cdn.shopify.com/s/files/1/0521/5917/files/Screen_Shot_2016-02-18_at_3.11.09_PM.png?5003393221482762451"
	}

	navs: Object[] = [
		{ location: '', lnr: 'calendar-full' },
		{ location: '', lnr: 'layers' },
		{ location: '', lnr: 'flag' },
		{ location: '', lnr: 'cog' },
	]
}


/* Mount Component */

@Component({
	selector: 'mount-node',
	template: `
		<div class="app__wrap">
			<layout-header></layout-header>
			<router-outlet></router-outlet>
		</div>
	`,
	directives: [RouterOutlet, RouterLink, LayoutHeader]
})
@RouteConfig([
	{ path: '/', name: 'ActivityViewport', component: ActivityViewport },
	{ path: '/calendar/...', name: 'ProfileViewport', component: ProfileViewport, useAsDefault: true },
])
export class MountNode {
}





/ * end */
