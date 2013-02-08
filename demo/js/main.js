jQuery(document).ready(function(){
	$('header').sticker({
		topSpace:0
	});

	$('h1').sticker({
		topSpace:20
	});

	$('footer').sticker({
		type: 'bottom',
		bottomSpace:0
	});

	$('.sidebar').sticker({
		type: 'sidebar',
		topSpace: 30
	});
});