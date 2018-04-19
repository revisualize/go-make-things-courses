/**
 * Script initializations
 */

// Responsive iframe videos
fluidvids.init({
	selector: ['iframe', 'object'],
	players: ['www.youtube.com', 'player.vimeo.com']
});

// Load app
app();

// Handle Slack registration
slack(function (response) {
	if (response.code === 200) {
		window.location.href = '/slack-success/';
	}
});

// Toggle password visibility
xray.init();