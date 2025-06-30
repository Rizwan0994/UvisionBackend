module.exports = Object.freeze({
    FILTER_TASK_TYPE: {
		ALL: "all",
		CREATOR: "creator",
		ASSIGNEE: "assign",
        GROUP_TASK: "tasks"
	},
    TASK_TYPE: {
        URGENT: 'urgent',
        EMERGENCY: 'emergency',
        ROUTINE: 'routine',
    },
    TASK_STATUS: {
        PENDING: 'pending',
        STARTED: 'started',
        PAUSED: 'paused',
        FINISHED: 'finished',
        REVIEW: 'review'
    },
    TASK_MEMBER_TYPE: {
        REVIEWER: 'reviewer',
        MEMBER: 'member',
    }
})