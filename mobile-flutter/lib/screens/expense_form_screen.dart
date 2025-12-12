import 'package:flutter/material.dart';

class ExpenseFormScreen extends StatelessWidget {
  const ExpenseFormScreen({super.key, this.expenseId});
  final String? expenseId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Expense')),
      body: Center(
        child: Text(
          expenseId != null ? 'Edit Expense: $expenseId' : 'New Expense',
        ),
      ),
    );
  }
}
