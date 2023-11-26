#!/src/bin/rails runner
  
begin

	MagicMatching::Setup.add_users()

rescue => e
	Rails.logger.error("== An error occurred: #{e.message}")
end
