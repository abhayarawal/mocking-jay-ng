import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams} from 'angular2/router';

import {ProfileViewport} from './profile/profile.component';
import {User, UserType} from './interfaces/interface';



@Component({
	template: `
		<h2>Login</h2>
	`
})
class AuthComponent {

}



@Component({
	selector: 'mount-node',
	template: `
		<div class="app__wrap">
			<router-outlet></router-outlet>
		</div>
	`,
	directives: [RouterOutlet, RouterLink]
})
@RouteConfig([
	{ path: '/', name: 'AuthComponent', component: AuthComponent, useAsDefault: true },
	{ path: '/calendar/...', name: 'ProfileViewport', component: ProfileViewport },
])
export class MountNode {
}





/ * end */
