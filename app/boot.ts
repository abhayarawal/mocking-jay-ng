/// <reference path="../node_modules/angular2/typings/browser.d.ts" />

import {MountNode} from './app.component';
import {bootstrap} from 'angular2/platform/browser';
import {ROUTER_PROVIDERS} from 'angular2/router';
import {HTTP_PROVIDERS, HTTP_BINDINGS} from 'angular2/http';

import {SegmentViewService} from './profile/segment.view.service';
import {TemplateService} from './services/template.service';
import {SegmentService} from './services/segment.service';
import {NotificationService, NotificationModalService} from './notification.service';
import {AuthService} from './auth/auth.service';
import {UserService} from './services/user.service';
import {FragmentService} from './services/fragment.service';
import {FacultyService} from './services/faculty.service';
import {RouterService} from './services/router.service';
import {NotifierService} from './services/notifier.service';
// import {CalendarService} from './profile/calendar.service';

bootstrap(MountNode, [
	ROUTER_PROVIDERS, HTTP_PROVIDERS, HTTP_BINDINGS, 
	AuthService, UserService, FacultyService, RouterService, NotifierService,
	SegmentViewService, TemplateService, SegmentService, NotificationService,
	FragmentService, NotificationModalService
]);