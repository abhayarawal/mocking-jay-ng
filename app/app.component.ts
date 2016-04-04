import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';

import {ProfileViewport} from './profile/profile.component';
import {User, UserType} from './interfaces/interface';
import {AuthComponent, LogoutComponent} from './auth/auth.component';
import {TemplateViewport} from './templates/template.component';
import {SegmentViewport} from './segments/segment.component';


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
	{ path: '/logout', name: 'LogoutComponent', component: LogoutComponent },
	{ path: '/calendar/...', name: 'ProfileViewport', component: ProfileViewport },
	{ path: '/templates/...', name: 'TemplateViewport', component: TemplateViewport },
	{ path: '/segments/...', name: 'SegmentViewport', component: SegmentViewport }
])
export class MountNode {
}





/ * end */
