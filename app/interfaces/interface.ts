export enum UserType {
	Student,
	Faculty
}

export interface User {
	id: string,
	fname?: string,
	lname?: string,
	avatar?: string,
	type: UserType
}


export interface Time {
	day: number,
	month: number,
	year: number,
	hour: number,
	minute: number
}

export interface Template {
	id: string,
	name: string,
	interval: any,
	allow_multiple: boolean,
	require_accept: boolean
}

export interface Segment {
	id: string,
	template: Template,
	start: Time,
	end: Time,
	repeat: boolean,
	repeat_start?: Time,
	repeat_end?: Time,
	instance_of?: string,
	location?: string
}


export enum Status {
	default,
	in_progress,
	approved, 
	denied,
	unavailable
}


export interface Fragment {
	id: string,
	start: Time,
	end: Time,
	segment: Segment,
	message?: string,
	status?: Status,
	response?: string,
	instance_id?: string
}






// end