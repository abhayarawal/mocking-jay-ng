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
	interval: number,
	allow_multiple: boolean,
	color: string,
	require_accept: boolean
}

export interface Segment {
	id: string,
	Template: Template,
	start: Time,
	end: Time,
	repeat: boolean,
	repeat_start?: Time,
	repeat_end?: Time,
	instance_id?: string,
	location?: string
}


export enum Status {
	in_progress,
	approved, 
	denied
}


export interface Fragment {
	id: string,
	start: Time,
	end: Time,
	status: Status,
	response?: string,
	instance_id?: string
}






// end