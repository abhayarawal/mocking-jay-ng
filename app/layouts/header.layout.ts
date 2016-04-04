import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {User, UserType} from '../interfaces/interface';

@Component({
	selector: 'main-nav',
	template: `
		<ul class="main__nav" *ngIf="navs">
			<li *ngFor="#nav of navs">
				<a [routerLink]="nav.location">
          <span class='lnr lnr-{{nav.lnr}}'></span>
        </a>
			</li>
			<li *ngIf="user">
				{{user.fname}} {{user.lname}}
				<a [routerLink]="['/LogoutComponent']"><img src="{{user.avatar}}" /></a>
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
		{ location: ['/ProfileViewport'], lnr: 'calendar-full' },
		{ location: ['/TemplateViewport'], lnr: 'layers' },
		{ location: ['/ProfileViewport'], lnr: 'flag' },
		{ location: ['/ProfileViewport'], lnr: 'cog' },
	]
}