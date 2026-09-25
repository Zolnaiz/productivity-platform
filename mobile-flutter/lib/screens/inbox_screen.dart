import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/inbox_provider.dart';
import '../utils/phase_one_strings.dart';

/// What the person has been told, newest first. Opening an item marks it read.
class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});
  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final inbox = context.read<InboxProvider>();
    await inbox.load();
    if (mounted && inbox.sessionExpired) {
      await context.read<AuthProvider>().expireSession();
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('inbox'))),
      body: Consumer<InboxProvider>(builder: (context, inbox, _) {
        if (inbox.loading && inbox.items.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        if (inbox.error != null && inbox.items.isEmpty) {
          return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(strings.error(inbox.error!)),
            const SizedBox(height: 12),
            FilledButton(onPressed: _load, child: Text(strings.text('retry'))),
          ]));
        }
        return RefreshIndicator(
          onRefresh: _load,
          child: inbox.items.isEmpty
              ? ListView(children: [
                  Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(strings.text('inboxEmpty')))
                ])
              : ListView.separated(
                  itemCount: inbox.items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final item = inbox.items[index];
                    return ListTile(
                      key: Key('inbox-${item.id}'),
                      leading: Icon(
                        item.read ? Icons.drafts_outlined : Icons.mail,
                        color: item.read
                            ? null
                            : Theme.of(context).colorScheme.primary,
                      ),
                      title: Text(
                        strings.taskTitle(
                            title: item.title,
                            key: item.titleKey,
                            params: item.titleParams),
                        style: TextStyle(
                            fontWeight:
                                item.read ? FontWeight.normal : FontWeight.w600),
                      ),
                      subtitle: item.body.isEmpty && item.bodyKey == null
                          ? null
                          : Text(strings.taskTitle(
                              title: item.body,
                              key: item.bodyKey,
                              params: item.bodyParams)),
                      isThreeLine: item.body.contains('\n'),
                      onTap: () => inbox.markRead(item),
                    );
                  },
                ),
        );
      }),
    );
  }
}
