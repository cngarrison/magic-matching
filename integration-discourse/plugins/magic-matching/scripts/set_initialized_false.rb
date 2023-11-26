#!/src/bin/rails runner
  
begin

	PluginStore.set("magic_matching", "is_initialized", false)

rescue => e
	Rails.logger.error("== An error occurred: #{e.message}")
end


