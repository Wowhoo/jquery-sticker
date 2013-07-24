jQuery(document).ready(function() {
	$('header').sticker({
		topSpace: 0
	});

	$('h1').sticker({
		topSpace: 20
	});

	$('footer').sticker({
		type: 'fill',
		bottomSpace: 0
	});

	$('.sidebar').sticker({
		type: 'sidebar',
		topSpace: 30
	});
	setInterval(function() {
		$('p').css('marginTop', '200px');
	}, 5000);
});

enquire.register("screen and (max-width:767px)", {
	match: function() {
		$('header').sticker('disable');
		$('h1').sticker('disable');
		$('footer').sticker('disable');
		$('.sidebar').sticker('disable');
	},

	unmatch: function() {
		$('header').sticker('enable');
		$('h1').sticker('enable');
		$('footer').sticker('enable');
		$('.sidebar').sticker('enable');
	}
}).listen();
