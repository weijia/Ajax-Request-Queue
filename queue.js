(function() {
  var RequestQueue;
  RequestQueue = (function() {
    function RequestQueue() {
      this.cbs = {
        complete: false,
        success: false,
        update: false,
        error: false
      };
      this.count_total = 0;
      this.count_complete = 0;
      this.count_error = 0;
      this.count_success = 0;
      this.results = [];
    }
    RequestQueue.prototype.success = function(fn) {
      return this.cbs.success = fn;
    };
    RequestQueue.prototype.succeeded = function(data, name, xhr) {
      if (this.count_total === this.count_success && this.cbs.success) {
        return this.cbs.success(this.results, name, xhr);
      }
    };
    RequestQueue.prototype.complete = function(fn) {
      return this.cbs.complete = fn;
    };
    RequestQueue.prototype.completed = function(data, name) {
      if (this.count_total === this.count_complete && this.cbs.complete) {
        return this.cbs.complete(this.results);
      }
    };
    RequestQueue.prototype.update = function(fn) {
      return this.cbs.update = fn;
    };
    RequestQueue.prototype.updated = function(data, name, succeeded, xhr) {
      this.count_complete++;
      if (succeeded) {
        this.count_success++;
      } else {
        this.count_error++;
      }
      this.results.push(data);
      if (this.cbs.update) {
        return this.cbs.update(data, this.status(), succeeded, xhr);
      }
    };
    RequestQueue.prototype.error = function(fn) {
      return this.cbs.error = fn;
    };
    RequestQueue.prototype.errored = function(xhr, name) {
      if (this.cbs.error) {
        return this.cbs.error(xhr, name);
      }
    };
    RequestQueue.prototype.status = function(type) {
      var c;
      if (type == null) {
        type = 'complete';
      }
      switch (type) {
        case 'success':
          c = this.count_success;
          break;
        case 'error':
          c = this.count_error;
          break;
        default:
          c = this.count_complete;
      }
      return [c, this.count_total];
    };
    RequestQueue.prototype.status_text = function(type) {
      if (type == null) {
        type = 'complete';
      }
      switch (this.status_percentage(type)) {
        case 0:
          return "Not started";
        case 100:
          return "Complete";
        default:
          return "In Progress";
      }
    };
    RequestQueue.prototype.status_percentage = function(type, rounding, sf) {
      var p, perc, vals;
      if (type == null) {
        type = 'complete';
      }
      if (rounding == null) {
        rounding = 0;
      }
      if (sf == null) {
        sf = false;
      }
      if (this.count_total + this.count_complete === 0) {
        return 0;
      }
      if (sf === false) {
        sf = rounding;
      }
      vals = this.status(type);
      rounding = Math.pow(10, rounding);
      perc = (Math.round(100 * rounding * vals[0] / vals[1]) / rounding).toString();
      if (sf > 0) {
        while ((p = perc.indexOf('.')) < 0) {
          perc += '.';
        }
        while (perc.length <= (p + sf)) {
          perc += '0';
        }
      }
      return perc;
    };
    RequestQueue.prototype.add = function(jq_xhr) {
      var self;
      this.count_total++;
      self = this;
      jq_xhr.complete(function(xhr, name) {
        return self.completed(xhr, name);
      });
      jq_xhr.success(function(data, name, xhr) {
        self.updated(data, name, true, xhr);
        return self.succeeded(data, name, xhr);
      });
      return jq_xhr.fail(function(xhr, name) {
        self.updated(xhr.responseText, name, false, xhr);
        return self.errored(xhr, name);
      });
    };
    return RequestQueue;
  })();
  this.RequestQueue = RequestQueue;
}).call(this);
