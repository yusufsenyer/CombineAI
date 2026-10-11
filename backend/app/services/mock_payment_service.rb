class MockPaymentService
  def self.charge(_user, _package)
    { success: true, transaction_id: "mock-#{SecureRandom.hex(6)}" }
  end
end
