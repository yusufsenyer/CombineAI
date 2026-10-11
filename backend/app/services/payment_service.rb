class PaymentService
  # MVP: mock implementation. Phase 2: swap to a real payment provider here,
  # the caller (SubscriptionsController) stays unchanged.
  def self.charge(user, package)
    MockPaymentService.charge(user, package)
  end
end
