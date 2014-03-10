/*
	# Gruntfile
	
	Code quality, build, and mangle tools.
	
	Updated for grunt 0.4.x.
*/

module.exports = function (grunt) {

// Project configuration.
grunt.initConfig({
	// package
	pkg: grunt.file.readJSON('package.json'),
	// locations
	dirs: {
		src: 'resources',
		vendor: 'vendor',
		dest: 'site'
	},
	/*
	lint/jshint automatic code quality checking
	*/
	jshint: {
		all: [
			'<%= dirs.src %>/js/*.js',
			'<%= dirs.src %>/js/*/*.js'
		],
		options: {
			camelcase: true,
			eqeqeq: true,
			immed: true,
			latedef: true,
			newcap: true,
			noarg: true,
			sub: true,
			undef: true,
			unused: true,
			// relax
			boss: true,
			smarttabs: true,
			strict: false,
			// environment
			browser: true,
			devel: true,
			globals: {
				// request
				'request': true,
				'$': true,
				'async': true,
				'saveAs': true
			}
		}
	},
	/*
	concat builds js for development
	*/
	concat: {
		index: {
			files: {
				'<%= dirs.dest %>/js/index.js': ['<%= dirs.src %>/js/*.js'],
				'<%= dirs.dest %>/js/library.js': ['<%= dirs.vendor %>/js/*.js']
			}
		}
	},
	/*
	minify builds js for distribution
	*/
	uglify: {
		options: {
			banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */'
		},
		index: {
			files: {
				'<%= dirs.dest %>/js/index.js': ['<%= dirs.src %>/js/index.js'],
				'<%= dirs.dest %>/js/library.js': ['<%= dirs.vendor %>/js/*.js']
			}
		}
	},
	/*
	compile html
	*/
	jade: {
		options: {
			path: '<%= dirs.src %>/jade/'
		},
		all: {
			files: {
				'<%= dirs.dest %>/index.html': '<%= dirs.src %>/jade/index.jade'
			}
		}
	},
	/*
	compile css
	*/
	stylus: {
		options: {
			compress: true
		},
		all: {
			files: {
				'<%= dirs.dest %>/css/style.css': '<%= dirs.src %>/stylus/style.styl'
			}
		}
	},
	watch: {
		files: [
			'<%= dirs.src %>/**'
		],
		tasks: 'default'
	}
});

// Load helpers
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-jade');
grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-contrib-stylus');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-watch');

// Tasks (command line)
grunt.registerTask('default', ['concat', 'jshint', 'jade', 'stylus']);
grunt.registerTask('dist', ['jshint', 'uglify', 'jade', 'stylus']);
// Tasks (used in makefile only)
grunt.registerTask('html', ['jade']);
grunt.registerTask('css', ['stylus']);
grunt.registerTask('js', ['jshint', 'concat']);
grunt.registerTask('dist-html', ['jade']);
grunt.registerTask('dist-css', ['stylus']);
grunt.registerTask('dist-js', ['jshint', 'uglify']);
};
