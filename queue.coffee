class RequestQueue

	# takes no arguments.
	constructor: () ->
		@cbs = {complete: false, success: false, update: false, error: false}
		@count_total = 0
		@count_complete = 0
		@count_error = 0
		@count_success = 0
		@results = []

	# takes a single function
	# fn is executed when all requests have succeeded
	# fn recieves an array of results
	success: (fn) ->
		@cbs.success = fn

	# internally called, executes the success fn when all requests are successful
	succeeded: (data, name, xhr) ->
		if @count_total == @count_success and @cbs.success
			@cbs.success(@results, name, xhr)


	# takes a single function
	# fn is executed when all requests have completed regardless of fate
	# fn recieves an array of results
	complete: (fn) ->
		@cbs.complete = fn

	# internally called, executes the complete fn when all requests complete
	completed: (data, name) ->
		if @count_total == @count_complete and @cbs.complete
			@cbs.complete(@results)


	# takes a single function
	# fn is executed each time a request completes, regardless of fate
	# fn recieves data/text, a status count [done, total], and a "succeeded" boolean
	update: (fn) ->
		@cbs.update = fn
	
	# internally called, executes the update fn when any request completes
	updated: (data, name, succeeded, xhr) ->
		@count_complete++

		if succeeded
			@count_success++
		else
			@count_error++

		@results.push(data)
		if @cbs.update
			@cbs.update(data, @status(), succeeded, xhr)

	
	# takes a single function
	# fn is executed when any request fails.
	# fn recieves the jqXHR object
	error: (fn) ->
		@cbs.error = fn
	
	# internally called, executes the error fn when any request fails
	errored: (xhr, name) ->
		if @cbs.error
			@cbs.error(xhr, name)


	# returns the current complete+total counts
	status: (type = 'complete') ->
		switch type
			when 'success' then c = @count_success
			when 'error' then c = @count_error
			else c = @count_complete

		return [c, @count_total]

	# returns simple text based on status (english, useless)
	status_text: (type = 'complete') ->
		switch @status_percentage(type)
			when 0   then return "Not started"
			when 100 then return "Complete"
			else          return "In Progress"

	# returns a percentage of requests completed, with optional rounding
	status_percentage: (type = 'complete', rounding = 0, sf = false) ->
		if @count_total + @count_complete == 0
			return 0
		
		if sf == false then sf = rounding
		
		vals = @status(type)
		rounding = Math.pow(10, rounding)
		perc     = (Math.round(100 * rounding * vals[0] / vals[1]) / rounding).toString()

		if sf > 0
			while (p = perc.indexOf('.')) < 0 then perc += '.'
			while perc.length <= (p + sf) then perc += '0'

		return perc

	# adds a jqXHR object to the queue. should be trivial to alter other libs (superagent, moo, etc.) to fit.
	add: (jq_xhr) ->
		@count_total++

		self = @
		jq_xhr.complete((xhr, name) -> self.completed(xhr, name))
		jq_xhr.success((data, name, xhr) -> self.updated(data, name, true, xhr); self.succeeded(data, name, xhr))
		jq_xhr.fail((xhr, name) -> self.updated(xhr.responseText, name, false, xhr); self.errored(xhr, name))

this.RequestQueue = RequestQueue