# frozen_string_literal: true

module Lab
  # Lab 5: burns `ms` of *CPU* time in pure Ruby (think: rendering a big JSON payload).
  # It measures this thread's CPU clock rather than wall time, so time spent waiting for
  # the GVL doesn't count. That's what makes the GVL wait visible in response times.
  class CpuWork
    MAX_MS = 2_000

    def self.call(ms)
      budget = ms.to_i.clamp(0, MAX_MS) / 1000.0
      started = Process.clock_gettime(Process::CLOCK_THREAD_CPUTIME_ID)
      iterations = 0
      while Process.clock_gettime(Process::CLOCK_THREAD_CPUTIME_ID) - started < budget
        500.times { |i| Math.sqrt(i * iterations) }
        iterations += 1
      end
      { cpu_ms: (budget * 1000).round, iterations: }
    end
  end
end
