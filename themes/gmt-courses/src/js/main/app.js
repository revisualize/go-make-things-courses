/**
 * Run the web app
 */
var app = function () {

	'use strict';

	//
	// Variables
	//

	var codeMap = {
		polyfills: [25501], // Beginner
		classList: [], // Advanced
		querySelector: [25501] // Complete
	};


	//
	// Methods
	//

	var decodeHTML = function (html) {
		var txt = document.createElement('textarea');
		txt.innerHTML = html;
		return txt.value;
	};

	var getUserCourses = function (data, ids) {
		for (var i = data.courses.length - 1; i >= 0; i--) {
			if (!ids.includes(parseInt(data.courses[i].id, 10))) {
				data.courses.splice(i, 1);
			}
		}
		return data;
	};

	var getData = function () {
		var data = sessionStorage.getItem('gmtCoursesLoggedIn');
		if (!data) return;
		return JSON.parse(data);
	};

	var getResources = function () {
		var data = getData();
		if (!data) return;
		return data.data.resources;
	};

	var getCourses = function () {
		var data = getData();
		if (!data) return;
		return data.data.courses;
	};

	var getCourse = function (id) {
		var data = getData();
		id = parseInt(id, 10);
		if (!data) return;
		return data.data.courses.find(function (course) {
			return parseInt(course.id, 10) === id;
		});
	};

	var getLesson = function (courseID, lessonID) {
		var course = getCourse(courseID);
		if (!course) return;
		return course.lessons.find(function (lesson) {
			return lesson.id === lessonID;
		});
	};

	var renderNoAccess = function (content) {
		content.innerHTML = '<p>You do not have access to this content. Sorry!</p>';
	};

	var renderDashboard = function (content) {
		var courses = getCourses();
		if (!courses) {
			content.innerHTML = '<ul><li>You don\'t have any courses yet.</li></ul>';
			return;
		}
		var courseList = '';
		courses.forEach(function (course) {
			courseList += '<li id="' + course.id + '"><a href="' + course.url + '">' + course.title + '</a></li>';
		});
		content.innerHTML = '<ul>' + courseList + '</ul>';
	};

	var renderLesson = function (content) {
		var lesson = getLesson(content.getAttribute('data-course'), content.getAttribute('data-lesson'));
		if (!lesson) {
			renderNoAccess(content);
			return;
		}
		var next = content.getAttribute('data-lesson-next');
		var prev = content.getAttribute('data-lesson-prev');
		content.innerHTML =
			'<div class="margin-bottom">' +
				'<iframe src="https://player.vimeo.com/video/' + lesson.video + '?title=0&byline=0&portrait=0" width="640" height="388" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>' +
			'</div>' +
			'<div class="clearfix margin-bottom">' +
				( next ? '<a class="btn float-right" href="' + next + '">Next Lesson &rarr;</a>' : '' ) +
				( prev ? '<a href="' + prev + '">&larr; Previous Lesson</a>' : '' ) +
			'</div>' +
			decodeHTML(lesson.content);
		fluidvids.render();
	};

	var renderResources = function (content) {
		var resources = getResources();
		var resourceList = '';
		if (!resources) {
			content.innerHTML = '';
			return;
		}
		resources.forEach(function (resource) {
			resourceList += '<li><a href="' + resource.url + '">' + resource.title + '</a></li>';
		});
		content.innerHTML = '<ul>' + resourceList + '</ul>';
	};

	var render = function () {

		// Variables
		var content = document.querySelector('[data-app]');
		if (!content) return;
		var type = content.getAttribute('data-app');

		// Render
		if (type === 'lesson') {
			renderLesson(content);
		} else if (type === 'dashboard') {
			renderDashboard(content);
		} else if (type === 'resources') {
			renderResources(content);
		}

		// Rehighlight code
		Prism.highlightAll();

	};

	var logUserIn = function (email, pw) {
		atomic.ajax({
			url: '/course-data.json'
		}).success(function (data) {
			var courseData = getUserCourses(data, codeMap[pw]);
			sessionStorage.setItem('gmtCoursesLoggedIn', JSON.stringify({
				email: email,
				data: courseData
			}));
			document.documentElement.className += ' logged-in';
			render();
		}).error(function () {
			// @todo issue an error on the form
		});
	};

	var throwLoginError = function () {
		var error = document.querySelector('#form-error');
		if (!error) return;
		error.innerHTML = 'Your email and/or passcode are incorrect.';
		error.classList.add('error-message');
	};

	var processLogin = function (form) {
		var email = form.querySelector('#email');
		var pw = form.querySelector('#password');
		if (!email || !pw || email.value.length < 1 || pw.value.length < 1) return;
		if (!codeMap[pw.value]) {
			throwLoginError();
			return;
		}
		logUserIn(email.value, pw.value);
	};


	//
	// Event Listeners & Inits
	//

	document.addEventListener('submit', function (event) {
		if (!event.target.matches('#login-form')) return;
		event.preventDefault();
		processLogin(event.target);
	}, false);

	document.addEventListener('click', function (event) {
		if (!event.target.matches('#logout')) return;
		event.preventDefault();
		sessionStorage.removeItem('gmtCoursesLoggedIn');
		window.location.reload();
	}, false);

	if (getData()) {
		render();
	}

};