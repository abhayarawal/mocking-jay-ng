import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';

import {ProfileViewport} from './profile/profile.component';
import {User, UserType} from './interfaces/interface';
import {AuthComponent, LogoutComponent} from './auth/auth.component';
import {TemplateViewport} from './templates/template.component';
import {SegmentViewport} from './segments/segment.component';
import {NotificationService, Notification} from './notification.service';

import {AuthService} from './auth/auth.service';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

@Component({
	selector: 'notification-component',
	template: `
		<div *ngIf="notification" class="notification__component" (click)="hide()" [ngClass]="{show: notification.type, red: notification.error}">
			<div class="notification__bar"></div>
			<strong>Notification</strong>
			<div>
				{{notification.message}}
			</div>
		</div>
	`
})
class NotificationComponent  implements OnInit {
	notification: Notification;
	notification$: Observable<Notification>;

	constructor(private notificationService: NotificationService) {
	}

	hide() {
		this.notification.type = false;
	}

	ngOnInit() {
		this.notification$ = this.notificationService.notification$;
		this.notification$.subscribe(
			(data) => {
				this.notification = data;
			}
		)
	}
}


@Component({
	selector: 'mount-node',
	template: `
		<div class="app__wrap">
			<router-outlet></router-outlet>
		</div>
		<notification-component></notification-component>
	`,
	directives: [RouterOutlet, RouterLink, NotificationComponent]
})
@RouteConfig([
	{ path: '/', name: 'AuthComponent', component: AuthComponent, useAsDefault: true },
	{ path: '/logout', name: 'LogoutComponent', component: LogoutComponent },
	{ path: '/calendar/...', name: 'ProfileViewport', component: ProfileViewport },
	{ path: '/templates/...', name: 'TemplateViewport', component: TemplateViewport },
	{ path: '/segments/...', name: 'SegmentViewport', component: SegmentViewport }
])
export class MountNode {
	// constructor(
	// 	private router: Router,
	// 	private authService: AuthService
	// ){}

	// ngOnInit() {
	// 	let [tokenExists, _] = this.authService.tokenExists();
	// 	if (!tokenExists) {
	// 		this.router.navigateByUrl('/');
	// 	}
	// }
}





/ * end */
